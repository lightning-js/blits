/*
 * Copyright 2023 Comcast Cable Communications Management, LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

let counter

export default function (templateObject = { children: [] }) {
  const ctx = {
    renderCode: ['const elms = []'],
    effectsCode: [],
    context: { props: [], components: this.components },
  }

  counter = -1
  generateCode.call(ctx, templateObject)
  ctx.renderCode.push('return elms')

  return {
    render: new Function('parent', 'component', 'context', ctx.renderCode.join('\n')),
    effects: ctx.effectsCode.map((code) => new Function('component', 'elms', 'context', code)),
    context: ctx.context,
  }
}

const generateElementCode = function (
  templateObject,
  parent = false,
  options = { key: false, component: 'component.', forceEffect: false }
) {
  const renderCode = options.forceEffect ? this.effectsCode : this.renderCode
  if (parent) {
    renderCode.push(`parent = ${parent}`)
  }

  if ('key' in templateObject) options.key = interpolate(templateObject.key, options.component)
  const elm = options.key ? `elms[${counter}][${options.key}]` : `elms[${counter}]`

  if (options.key) {
    renderCode.push(`
      elms[${counter}] = elms[${counter}] || {}
    `)
  }

  renderCode.push(`
    if(!${elm}) {
      ${elm} = this.element({componentId: component[Symbol.for('id')], parent: parent || 'root'}, component)
    }
    const elementConfig${counter} = {}
  `)

  const children = templateObject['children']
  delete templateObject['children']

  Object.keys(templateObject).forEach((key) => {
    if (key === 'type') {
      if (templateObject[key] === 'Slot') {
        renderCode.push(`elementConfig${counter}[Symbol.for('isSlot')] = true`)
      }
      return
    }

    if (key === 'slot') {
      renderCode.push(`
        elementConfig${counter}['parent'] = component[Symbol.for('slots')].filter(slot => slot.ref === '${templateObject.slot}').shift() || component[Symbol.for('slots')][0] || parent
      `)
    }

    if (isReactiveKey(key)) {
      this.effectsCode.push(
        `${elm}.set('${key.substring(1)}', ${interpolate(templateObject[key], options.component)})`
      )
    } else {
      renderCode.push(
        `elementConfig${counter}['${key}'] = ${cast(templateObject[key], key, options.component)}`
      )
    }
  })

  if (options.holder === true) {
    renderCode.push(`
    if(typeof cmp${counter} !== 'undefined') {
      for(key in cmp${counter}.config.props) {
        delete elementConfig${counter}[cmp${counter}.config.props[key]]
      }
    }
    `)
  }

  renderCode.push(`
    if(!${elm}.nodeId) {
      ${elm}.populate(elementConfig${counter})
    }
  `)

  if (children) {
    generateCode.call(this, { children }, `${elm}`, options)
  }
}

const generateComponentCode = function (
  templateObject,
  parent = false,
  options = { key: false, component: 'component.', forceEffect: false, holder: false }
) {
  const renderCode = options.forceEffect ? this.effectsCode : this.renderCode

  renderCode.push(`
    const cmp${counter} =
      (context.components && context.components['${templateObject.type}']) ||
      component[Symbol.for('components')]['${templateObject.type}']
  `)

  if ('key' in templateObject) {
    options.key = interpolate(templateObject.key, options.component)
  }

  const children = templateObject.children
  delete templateObject.children
  generateElementCode.call(this, templateObject, parent, { ...options, ...{ holder: true } })

  parent = options.key ? `elms[${counter}][${options.key}]` : `elms[${counter}]`

  counter++

  const elm = options.key ? `elms[${counter}][${options.key}]` : `elms[${counter}]`

  if (options.key) {
    renderCode.push(`
      elms[${counter}] = elms[${counter}] || {}
    `)
  }

  if (parent) {
    renderCode.push(`parent = ${parent}`)
  }

  renderCode.push(`const props${counter} = {}`)
  Object.keys(templateObject).forEach((key) => {
    if (key === 'type') return
    if (isReactiveKey(key)) {
      this.effectsCode.push(`
        ${elm}[Symbol.for('props')]['${key.substring(1)}'] = ${interpolate(
        templateObject[key],
        options.component
      )}`)
      renderCode.push(
        `props${counter}['${key.substring(1)}'] = ${interpolate(
          templateObject[key],
          options.component
        )}`
      )
    } else {
      renderCode.push(
        `props${counter}['${key}'] = ${cast(templateObject[key], key, options.component)}`
      )
    }
  })

  renderCode.push(`
    if(!${elm}) {
      ${elm} = (context.components && context.components['${templateObject.type}'] || component[Symbol.for('components')]['${templateObject.type}'] || (() => { console.log('component ${templateObject.type} not found')})).call(null, {props: props${counter}}, ${parent}, component)
      if (${elm}[Symbol.for('slots')][0]) {
        parent = ${elm}[Symbol.for('slots')][0]
        component = ${elm}
      } else {
        parent = ${elm}[Symbol.for('children')][0]
      }
    }
  `)

  if (children) {
    counter++
    generateElementCode.call(this, { children }, false, { ...options })
  }
}

const generateForLoopCode = function (templateObject, parent) {
  const forLoop = templateObject[':for']
  delete templateObject[':for']

  const regex = /(.+)\s+in\s+(.+)/gi
  //   const regex = /(:?\(*)(.+)\s+in\s+(.+)/gi

  const result = regex.exec(forLoop)

  // can be improved with a smarter regex
  const [item, index = 'index'] = result[1]
    .replace('(', '')
    .replace(')', '')
    .split(/\s*,\s*/)

  // local context
  const ctx = {
    renderCode: [],
    effectsCode: [],
    context: { props: [], components: this.components },
  }

  if (parent) {
    ctx.renderCode.push(`parent = ${parent}`)
  }
  ctx.renderCode.push(`
    const collection = ${cast(result[2], ':for')}
    const keys = []
    for(let __index = 0; __index < collection.length; __index++) {
      parent = ${parent}
      if(!component.key) keys.length = 0
      const scope = Object.assign(component, {
        key: Math.random(),
        ${index}: __index,
        ${item}: collection[__index]
      })
    `)

  if ('key' in templateObject) {
    ctx.renderCode.push(`
      keys.push(${interpolate(templateObject.key, 'scope.')})
    `)
  } else {
    ctx.renderCode.push(`
      keys.push(scope.key.toString())
    `)
  }

  if (templateObject.type === 'Element' || templateObject.type === 'Slot') {
    generateElementCode.call(ctx, templateObject, parent, {
      key: 'scope.key',
      component: 'scope.',
      forceEffect: false,
    })
  } else {
    generateComponentCode.call(ctx, templateObject, false, {
      key: 'scope.key',
      component: 'scope.',
      forceEffect: false,
    })
  }
  ctx.renderCode = ctx.renderCode.concat(ctx.effectsCode)
  ctx.renderCode.push('}')

  ctx.renderCode.push(`
    if(elms[${counter}]) {
      Object.keys(elms[${counter}]).forEach(key => {
        if(keys.indexOf(key) === -1) {
          elms[${counter}][key].delete && elms[${counter}][key].delete()
          elms[${counter}][key].destroy && elms[${counter}][key].destroy()
          delete elms[${counter}][key]
        }
      })
    }
  `)
  this.effectsCode.push(ctx.renderCode.join('\n'))
}

const generateCode = function (templateObject, parent = false, options = {}) {
  templateObject.children &&
    templateObject.children.forEach((childTemplateObject) => {
      counter++

      if (Object.keys(childTemplateObject).indexOf(':for') > -1) {
        generateForLoopCode.call(this, childTemplateObject, parent)
      } else {
        if (childTemplateObject.type === 'Element' || childTemplateObject.type === 'Slot') {
          generateElementCode.call(this, childTemplateObject, parent, options)
        } else {
          generateComponentCode.call(this, childTemplateObject, parent, options)
        }
      }
    })
}

const interpolate = (val, component = 'component.') => {
  const replaceString = /('.*?')+/gi
  const replaceDollar = /\$/gi
  const matches = val.matchAll(replaceString)
  const restore = []

  let i = 0

  // replace string and store in temp
  for (const match of matches) {
    restore.push(match[0])
    val = val.replace(match[0], `[@@REPLACEMENT${i}@@]`)
    i++
  }

  // replace remaining dollar signs
  val = val.replace(replaceDollar, component)

  // restore string replacemenet
  restore.forEach((el, idx) => {
    val = val.replace(`[@@REPLACEMENT${idx}@@]`, el)
  })

  return val
}

const cast = (val = '', key = false, component = 'component.') => {
  let castedValue

  // inline content
  if (key === 'content') {
    if (val.startsWith('$')) {
      castedValue = `${component}${val.replace('$', '')}`
    } else {
      castedValue = `'${parseInlineContent(val, component)}'`
    }
  }
  // numeric
  else if (key !== 'color' && !isNaN(parseFloat(val))) {
    castedValue = parseFloat(val)
    if (val.endsWith('%')) {
      const map = {
        w: 'width',
        width: 'width',
        x: 'width',
        h: 'height',
        height: 'height',
        y: 'height',
      }
      const base = map[key]
      if (base) {
        castedValue = `parent.node.${base} * (${castedValue} / 100)`
      }
    }
  }
  // boolean true
  else if (val.toLowerCase() === 'true') {
    castedValue = true
  }
  // boolean false
  else if (val.toLowerCase() === 'false') {
    castedValue = false
  }
  // @-listener
  else if (key.startsWith('@') && val) {
    const c = component.slice(0, -1)
    castedValue = `${c}['${val.replace('$', '')}'] && ${c}['${val.replace('$', '')}'].bind(${c})`
  }
  // dynamic value
  else if (val.startsWith('$')) {
    castedValue = `${component}${val.replace('$', '')}`
  }
  // static string
  else {
    castedValue = `"${val}"`
  }

  return castedValue
}

const isReactiveKey = (str) => str.startsWith(':')

const parseInlineContent = (val, component) => {
  const dynamicParts = /\{\{\s*(\$\S+)\s*\}\}/g
  const matches = [...val.matchAll(dynamicParts)]

  if (matches.length) {
    for (let [match, arg] of matches) {
      val = val.replace(match, `${arg.replace('$', `'+${component}`)}+'`)
    }
  }
  return val
}
