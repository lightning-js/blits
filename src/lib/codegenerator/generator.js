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
let nestedForDepth
let scopeCounter
let forEndCounterMap

export default function (templateObject = { children: [] }) {
  const ctx = {
    renderCode: ['const elms = []', 'let componentType', 'const rootComponent = component'],
    effectsCode: [],
    context: { props: [], components: this.components },
  }

  counter = -1
  scopeCounter = -1
  nestedForDepth = -1
  forEndCounterMap = new Map()
  generateCode.call(ctx, templateObject)
  ctx.renderCode.push('return elms')

  return {
    render: new Function(
      'parent',
      'component',
      'context',
      'components',
      'effect',
      'getRaw',
      ctx.renderCode.join('\n')
    ),
    effects: ctx.effectsCode.map(
      (code) =>
        new Function('component', 'elms', 'context', 'components', 'rootComponent', 'effect', code)
    ),
    context: ctx.context,
  }
}

const generateElementCode = function (
  templateObject,
  parent = false,
  options = { key: false, component: 'component.', forceEffect: false, forloop: false }
) {
  const renderCode = options.forceEffect ? this.effectsCode : this.renderCode
  if (parent) {
    renderCode.push(`parent = ${parent}`)
  }

  if ('key' in templateObject) options.key = interpolate(templateObject.key, options.component)
  const elm = options.key ? `elms[${counter}][${options.key}]` : `elms[${counter}]`

  if (options.key) {
    renderCode.push(`
      if(elms[${counter}] === undefined) {
        elms[${counter}] = {}
      }
    `)
  }

  renderCode.push(`const elementConfig${counter} = {}`)

  if (options.forloop) {
    renderCode.push(`if(${elm} === undefined) {`)
  }

  renderCode.push(`
    ${elm} = this.element({parent: parent || 'root'}, component)
  `)

  if (options.forloop) {
    renderCode.push('}')
  }

  const children = templateObject['children']
  delete templateObject['children']

  if (templateObject[Symbol.for('componentType')] === 'Slot') {
    renderCode.push(`elementConfig${counter}[Symbol.for('isSlot')] = true`)
  }

  Object.keys(templateObject).forEach((key) => {
    if (key === 'slot') {
      renderCode.push(`
        elementConfig${counter}['parent'] = component[Symbol.for('slots')].filter(slot => slot.ref === '${templateObject.slot}').shift() || component[Symbol.for('slots')][0] || parent
      `)
    }

    if (key === 'key') return

    if (isReactiveKey(key)) {
      if (options.holder && key === ':color') return
      if (options.holder) {
        this.effectsCode.push(`
        if(typeof skip${counter} === 'undefined' ||
          skip${counter}.indexOf('${key.substring(1)}') === -1)
          ${elm}.set('${key.substring(1)}', ${interpolate(templateObject[key], options.component)})
        `)
      } else {
        this.effectsCode.push(`
            ${elm}.set('${key.substring(1)}', ${interpolate(
          templateObject[key],
          options.component
        )})
          `)
      }
      renderCode.push(
        `elementConfig${counter}['${key.substring(1)}'] = ${interpolate(
          templateObject[key],
          options.component
        )}`
      )
    } else {
      renderCode.push(
        `elementConfig${counter}['${key}'] = ${cast(templateObject[key], key, options.component)}`
      )
    }
  })

  if (options.holder === true) {
    renderCode.push(`
    const skip${counter} = []
    if(typeof cmp${counter} !== 'undefined') {
      for(let key in cmp${counter}.config.props) {
        delete elementConfig${counter}[cmp${counter}.config.props[key]]
        skip${counter}.push(cmp${counter}.config.props[key])
      }
    }
    `)
  }

  if (options.forloop) {
    renderCode.push(`if(${elm}.nodeId === undefined) {`)
  }

  renderCode.push(`${elm}.populate(elementConfig${counter})`)

  if (options.forloop) {
    renderCode.push('}')
  }

  if (children) {
    generateCode.call(this, { children }, `${elm}`, options)
  }
}

const generateComponentCode = function (
  templateObject,
  parent = false,
  options = {
    key: false,
    component: 'component.',
    forceEffect: false,
    holder: false,
    forloop: false,
  }
) {
  const renderCode = options.forceEffect ? this.effectsCode : this.renderCode

  renderCode.push(`
    const cmp${counter} =
      (context.components && context.components['${
        templateObject[Symbol.for('componentType')]
      }']) || components['${templateObject[Symbol.for('componentType')]}']
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
      if(elms[${counter}] === undefined) {
        elms[${counter}] = {}
      }
    `)
  }

  if (parent) {
    renderCode.push(`parent = ${parent}`)
  }

  renderCode.push(`const props${counter} = {}`)

  if (options.forloop) {
    renderCode.push(`if(${elm} === undefined) {`)
  }

  Object.keys(templateObject).forEach((key) => {
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
    componentType = props${counter}['is'] || '${templateObject[Symbol.for('componentType')]}'

    let component${counter}
    if(typeof componentType === 'string') {
      component${counter} = context.components && context.components[componentType] || components[componentType]
      if(!component${counter}) {
        throw new Error('Component "${templateObject[Symbol.for('componentType')]}" not found')
      }
    } else if(typeof componentType === 'function' && componentType.name === 'factory') {
      component${counter} = componentType
    }

    ${elm} = component${counter}.call(null, {props: props${counter}}, ${parent}, component)

    if (${elm}[Symbol.for('slots')][0]) {
      parent = ${elm}[Symbol.for('slots')][0]
      component = ${elm}
    } else {
      parent = ${elm}[Symbol.for('children')][0]
    }
  `)

  if (options.forloop) {
    renderCode.push('}')
  }

  if (children) {
    counter++
    generateElementCode.call(this, { children }, false, { ...options })
  }
  // if (!options.forloop) {
  //   renderCode.push(`
  //   component = rootComponent
  // `)
  // }
}

const generateForLoopCode = function (templateObject, parent) {
  // Set actual endCounter of previous for-loop
  if (forEndCounterMap.has(nestedForDepth) === true) {
    forEndCounterMap.set(nestedForDepth, counter - 1)
  }

  nestedForDepth++

  // Set initial endCounter of for-loop to -1
  forEndCounterMap.set(nestedForDepth, -1)

  const forLoop = templateObject[':for']
  delete templateObject[':for']

  const key = templateObject['key']

  scopeCounter++
  const forKey = interpolate(key, `scope${scopeCounter}.`)

  const shallow = !!!(
    templateObject['$shallow'] && templateObject['$shallow'].toLowerCase() === 'false'
  )
  delete templateObject['$shallow']

  delete templateObject['key']
  const regex = /(.+)\s+in\s+(.+)/gi
  //   const regex = /(:?\(*)(.+)\s+in\s+(.+)/gi

  const result = regex.exec(forLoop)

  // can be improved with a smarter regex
  const [item, index = 'index'] = result[1]
    .replace('(', '')
    .replace(')', '')
    .split(/\s*,\s*/)

  const scopeRegex = new RegExp(`(scope${scopeCounter}\\.(?!${item}\\.|${index}|key)(\\w+))`, 'gi')

  // local context
  const ctx = {
    renderCode: [],
    effectsCode: [],
    context: { props: [], components: this.components },
  }

  if (parent) {
    ctx.renderCode.push(`parent = ${parent}`)
  }

  const forStartCounter = counter

  ctx.renderCode.push(`
    const created${forStartCounter} = []
    const forloop${forStartCounter} = (collection = [], elms, created) => {
      const rawCollection = getRaw(collection)
      const keys = new Set()
      let l = rawCollection.length
      while(l--) {
        const ${item} = rawCollection[l]
        keys.add('' +  ${interpolate(key, '') || 'l'})
      }
  `)

  // keep track of the index in the render code so we can inject
  // the code that takes care of destroying elements (generated later on)
  // in the right spot
  const indexToInjectDestroyCode = ctx.renderCode.length

  ctx.renderCode.push(`
      created.length = 0
      const length = rawCollection.length
      for(let __index = 0; __index < length; __index++) {
        const scope${scopeCounter} = Object.create(component)
        parent = ${parent}
        scope${scopeCounter}['${index}'] = __index
        scope${scopeCounter}['${item}'] = rawCollection[__index]
        scope${scopeCounter}['key'] = '' + ${forKey || '__index'}
  `)

  if ('ref' in templateObject && templateObject.ref.indexOf('$') === -1) {
    // automatically map the ref for each item in the loop based on the given ref key
    ctx.renderCode.push(`
        scope${scopeCounter}['__ref'] = '${templateObject.ref}' + __index
    `)
    templateObject.ref = '$__ref'
  }

  ctx.renderCode.push(`
        created.push(scope${scopeCounter}.key)
  `)

  if (
    templateObject[Symbol.for('componentType')] === 'Element' ||
    templateObject[Symbol.for('componentType')] === 'Slot' ||
    templateObject[Symbol.for('componentType')] === 'Text'
  ) {
    generateElementCode.call(ctx, templateObject, parent, {
      key: `scope${scopeCounter}.key`,
      component: `scope${scopeCounter}.`,
      forceEffect: false,
      forloop: true,
    })
  } else {
    generateComponentCode.call(ctx, templateObject, false, {
      key: `scope${scopeCounter}.key`,
      component: `scope${scopeCounter}.`,
      forceEffect: false,
      forloop: true,
    })
  }

  // separate effects that only rely on variables in the itteration
  const innerScopeEffects = ctx.effectsCode.filter(
    (effect) => [...effect.matchAll(scopeRegex)].length === 0
  )

  // separate effects that (also) rely on variables in the outer scope
  const outerScopeEffects = ctx.effectsCode.filter(
    (effect) => [...effect.matchAll(scopeRegex)].length !== 0
  )

  if (shallow === false) {
    ctx.renderCode.push(`
      scope${scopeCounter}['${item}'] = null
      scope${scopeCounter}['${item}'] = collection[__index]
  `)
  }

  // inner scope variables are part of the main forloop
  innerScopeEffects.forEach((effect) => {
    const key = effect.indexOf(`scope.${index}`) > -1 ? `'${interpolate(result[2], '')}'` : null
    if (effect.indexOf("Symbol.for('props')") === -1) {
      ctx.renderCode.push(`
        effect(() => {
          ${effect}
        }, ${key})
      `)
    } else {
      // props shouldn't be wrapped in an effect, but simply passed on
      ctx.renderCode.push(`
        ${effect}
      `)
    }
  })
  // if(elms[${forStartCounter}][0] && elms[${forStartCounter}][0].forComponent && elms[${forStartCounter}][0].forComponent.___layout) {
  //   elms[${forStartCounter}][0].forComponent.___layout()
  // }
  ctx.renderCode.push(`
    }
  }`)

  // generate code that destroys items
  const destroyCode = []
  destroyCode.push(`
      let i = created.length

      while (i--) {
        if (keys.has(created[i]) === false) {
          const key = created[i]
  `)
  // Get endCounter from Map that was stored, for non nested for-loop
  // endCounter would be -1 then get's real endCounter from counter

  const endCounter = forEndCounterMap.get(nestedForDepth)
  const forEndCounter = endCounter === -1 ? counter : endCounter

  for (let i = forStartCounter; i <= forEndCounter; i++) {
    destroyCode.push(`
          elms[${i}][key] && elms[${i}][key].destroy()
          delete elms[${i}][key]
      `)
  }
  destroyCode.push(`
       }
    }
  `)

  // inject the destroy code in the correct spot
  ctx.renderCode.splice(indexToInjectDestroyCode, 0, ...destroyCode)
  ctx.renderCode.push(`
    effect(() => {
      forloop${forStartCounter}(${
    nestedForDepth == 0
      ? cast(result[2], ':for')
      : cast(result[2], ':for', `scope${scopeCounter - 1}.`)
  }, elms, created${forStartCounter})
    }, '${interpolate(result[2], '')}')
  `)

  outerScopeEffects.forEach((effect) => {
    const matches = [...effect.matchAll(scopeRegex)]

    let l = matches.length
    const refs = []
    while (l--) {
      const match = matches[l]
      const ref = `component.${match[2]}`
      refs.indexOf(ref) === -1 && refs.push(ref)
      effect =
        effect.substring(0, match.index) + ref + effect.substring(match.index + match[1].length)
    }

    ctx.renderCode.push(`
      effect(() => {
        void ${refs.join(', ')}
        for(let __index = 0; __index < ${interpolate(result[2])}.length; __index++) {
          const scope${scopeCounter} = {}
          scope${scopeCounter}['${index}'] = __index
          scope${scopeCounter}['${item}'] = ${interpolate(result[2])}[__index]
          scope${scopeCounter}['key'] = ${forKey || '__index'}
    `)

    ctx.renderCode.push(`
          ${effect}
        }
      })
    `)
  })
  this.renderCode.push(ctx.renderCode.join('\n'))

  // Decrement counter
  nestedForDepth--
}

const generateCode = function (templateObject, parent = false, options = {}) {
  templateObject.children &&
    templateObject.children.forEach((childTemplateObject) => {
      counter++

      if (Object.keys(childTemplateObject).indexOf(':for') > -1) {
        generateForLoopCode.call(this, childTemplateObject, parent)
      } else {
        if (
          childTemplateObject[Symbol.for('componentType')] === 'Element' ||
          childTemplateObject[Symbol.for('componentType')] === 'Slot' ||
          childTemplateObject[Symbol.for('componentType')] === 'Text'
        ) {
          if (childTemplateObject[Symbol.for('componentType')] === 'Text') {
            childTemplateObject.__textnode = 'true'
          }
          generateElementCode.call(this, childTemplateObject, parent, options)
        } else {
          generateComponentCode.call(this, childTemplateObject, parent, options)
        }
      }
    })
}

const interpolate = (val, component = 'component.') => {
  if (val === undefined) return val
  const replaceString = /('.*?')+/gi
  const replaceDollar = /\$(\$(?=\$)|\$?)/g
  const matches = val.matchAll(replaceString)
  const restore = []

  let i = 0

  // replace string and store in temp
  for (const match of matches) {
    restore.push(match[0])
    val = val.replace(match[0], `[@@REPLACEMENT${i}@@]`)
    i++
  }

  // replace dollar signs using the regex and function
  val = val.replace(replaceDollar, (match, group1) => {
    // single dollar sign
    if (group1 === '') {
      return component
    }
    // consecutive dollar sign, replace only the first $
    else if (group1 === '$') {
      return component + '$'
    }
  })

  // restore string replacement
  restore.forEach((el, idx) => {
    val = val.replace(`[@@REPLACEMENT${idx}@@]`, el)
  })

  return val
}

const cast = (val = '', key = false, component = 'component.') => {
  const dynamicArgumentRegex = /\$\w+/gi
  let castedValue

  // inline content
  if (key === 'content') {
    if (val.startsWith('$')) {
      castedValue = `${component}${val.replace('$', '')}`
    } else {
      // unescaped single quotes must be escaped while preserving escaped backslashes
      const escapedVal = val
        .replace(/\\\\/g, '__DOUBLE_BACKSLASH__')
        .replace(/(^|[^\\])'/g, "$1\\'")
        .replace(/__DOUBLE_BACKSLASH__/g, '\\\\')
      castedValue = `'${parseInlineContent(escapedVal, component)}'`
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
  // dynamic value in object
  else if (dynamicArgumentRegex.exec(val)) {
    const rex = /\w+\s*:\s*(?:[^\s,}]+|".*?"|'.*?')/g
    const results = val.match(rex)
    castedValue = {}
    if (results) {
      for (let i = 0; i < results.length; i++) {
        const members = results[i].split(/\s*:\s*/)
        if (members) {
          populateFields(members[0], members[1], component, castedValue)
        }
      }
    }
    return interpolateObject(castedValue)
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

// Populate value into target's prop
const populateFields = (prop, val, component, target) => {
  if (val.startsWith('$')) {
    target[prop] = `${component}${val.replace('$', '')}`
  } else {
    target[prop] = val
  }
}

const interpolateObject = (input) => {
  const interpolatedResults = []
  Object.keys(input).forEach((key) => {
    interpolatedResults.push(`${key}: ${input[key]}`)
  })

  return ` { ${interpolatedResults.join(', ')} }`
}
