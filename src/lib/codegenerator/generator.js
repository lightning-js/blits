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
let isDev

export default function (templateObject = { children: [] }, devMode = false) {
  const ctx = {
    renderCode: [
      'const elms = []',
      'const elementConfigs = []',
      'const forloops = []',
      'const props = []',
      'const created = []',
      'const effects = {}',
      'const skips = []',
      'let componentType',
      'let rootComponent = component',
      'let propData',
      'let slotComponent',
      'let inSlot = false',
      'let slotChildCounter = 0',
      'let cmps = []',
    ],
    effectsCode: [],
    cleanupCode: [
      'rootComponent = null',
      'propData = null',
      'slotComponent = null',
      'parent = null',
    ],
    context: { props: [], components: this.components },
  }

  counter = -1
  isDev = devMode
  if (isDev === true) {
    ctx.renderCode.push(`
      function propInComponent(prop, kind="dynamic") {
        const property = prop.includes('.') ? prop.split('.')[0] : prop
        if (kind === 'reactive' || prop.includes('.') === false) {
          if (property in component === false) {
            Log.warn('Property ' +  property + ' was accessed during render but is not defined on instance')
          }
        } else {
          const nestedKeys = prop.split('.')
          let base = component
          for(let i =0; i<nestedKeys.length;i++){
            if (base[nestedKeys[i]] === undefined) {
              Log.warn('Property ' +  nestedKeys.slice(0,i+1).join('.') + ' was accessed during render but is not defined on instance')
            }
            base = base[nestedKeys[i]]
          }
        }
      }
    `)
  }
  generateCode.call(ctx, templateObject)
  ctx.renderCode.push(`
    return { elms, cleanup: () => {
      ${ctx.cleanupCode.join('\n')}
      component = null
      cmps.length = 0
      elms.length = 0
      components.length = 0
      elementConfigs.length = 0
      forloops.length = 0
      props.length = 0
      skips.length = 0
    }}
  `)

  return {
    render: new Function(
      'parent',
      'component',
      'context',
      'components',
      'effect',
      'getRaw',
      'Log',
      ctx.renderCode.join('\n')
    ),
    effects: ctx.effectsCode.map(
      (code) =>
        new Function('component', 'elms', 'context', 'components', 'rootComponent', 'effect', code)
    ),
    context: ctx.context,
  }
}

// This is used to get only variable from expression
const extractVariables = function (value) {
  const regEx = /\$\$?\w+(\.\w+)?/g
  const matches = value.match(regEx)
  if (matches !== null) {
    const shaderRegex = /\$shader/
    return matches.filter((match) => !shaderRegex.test(match))
  } else {
    return false
  }
}

const verifyVariables = function (value, renderCode, type = 'dynamic') {
  const variablesToBeVerified = extractVariables(value)
  if (variablesToBeVerified !== false) {
    for (let i = 0; i < variablesToBeVerified.length; i++) {
      let variable = variablesToBeVerified[i]
      if (type === 'reactive' && variable.includes('.')) {
        variable = variable.split('.')[0]
      }
      renderCode.push(`propInComponent('${variable.replace('$', '')}', '${type}')`)
    }
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

  renderCode.push(`elementConfigs[${counter}] = {}`)

  if (counter === 0) {
    renderCode.push(`elementConfigs[${counter}]['___wrapper'] = true `)
  }

  if (options.forloop) {
    renderCode.push(`if(${elm} === undefined) {`)
  }

  renderCode.push(`
    ${elm} = this.element({parent: parent || 'root'}, inSlot === true ? slotComponent : component)
  `)

  if (options.forloop) {
    renderCode.push('}')
  }

  const children = templateObject['children']
  delete templateObject['children']

  if (templateObject[Symbol.for('componentType')] === 'Slot') {
    renderCode.push(`elementConfigs[${counter}][Symbol.for('isSlot')] = true`)
  }

  Object.keys(templateObject).forEach((key) => {
    if (key === 'slot') {
      renderCode.push(`
        elementConfigs[${counter}]['parent'] = slotComponent[Symbol.for('slots')] !== undefined && Array.isArray(slotComponent[Symbol.for('slots')]) === true && slotComponent[Symbol.for('slots')].filter(slot => slot.ref === '${templateObject.slot}').shift() || parent
      `)
    }

    if (key === 'key') return

    // Skip inspector-data in production builds for performance optimization
    if (key === 'inspector-data' && !isDev) return

    const value = templateObject[key]

    if (isReactiveKey(key)) {
      if (options.holder && key === ':color') return
      if (options.holder) {
        this.effectsCode.push(`
        if(typeof skips === 'undefined' || (typeof skips[${counter}] === 'undefined' ||
          skips[${counter}].indexOf('${key.substring(1)}') === -1))
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
      // value.includes('.') === false &&
      if (isDev === true && options.component !== 'scope.' && value.includes('$')) {
        verifyVariables(value, renderCode, 'reactive')
      }
      renderCode.push(
        `elementConfigs[${counter}]['${key.substring(1)}'] = ${interpolate(
          value,
          options.component
        )}`
      )
    } else {
      if (isDev === true && options.component !== 'scope.' && value.includes('$')) {
        verifyVariables(value, renderCode)
      }
      renderCode.push(
        `elementConfigs[${counter}]['${key}'] = ${cast(value, key, options.component)}`
      )
    }
  })

  if (options.holder === true) {
    renderCode.push(`
    skips[${counter}] = []
    if(typeof cmps[${counter}] !== 'undefined') {
      for(let key in cmps[${counter}][Symbol.for('config')].props) {
        delete elementConfigs[${counter}][cmps[${counter}][Symbol.for('config')].props[key]]
        skips[${counter}].push(cmps[${counter}][Symbol.for('config')].props[key])
      }
    }
    `)
  }

  if (options.forloop) {
    renderCode.push(`if(${elm}.nodeId === undefined) {`)
  }

  renderCode.push(`${elm}.populate(elementConfigs[${counter}])`)

  renderCode.push(`
    if(inSlot === true) {
      slotChildCounter -= 1
    }
  `)

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
    cmps[${counter}] =
      (context.components && context.components['${
        templateObject[Symbol.for('componentType')]
      }']) || components['${templateObject[Symbol.for('componentType')]}']
  `)

  this.cleanupCode.push(`
    cmps[${counter}] = null
  `)

  if ('key' in templateObject) {
    options.key = interpolate(templateObject.key, options.component)
  }

  const children = templateObject.children
  delete templateObject.children
  // Capture holder counter before generating element code (which may process children and increment counter)
  const holderCounter = counter
  generateElementCode.call(this, templateObject, parent, { ...options, ...{ holder: true } })

  parent = options.key ? `elms[${holderCounter}][${options.key}]` : `elms[${holderCounter}]`

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
    renderCode.push(`parent = ${parent};`)
  }

  renderCode.push(`props[${counter}] = {}`)
  this.cleanupCode.push(`props[${counter}] = null`)

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
      renderCode.push(`
        propData = ${interpolate(templateObject[key], options.component)}
        if (Array.isArray(propData) === true) {
          propData = getRaw(propData).slice(0)
        }
        props[${counter}]['${key.substring(1)}'] = propData`)
    } else {
      renderCode.push(
        `props[${counter}]['${key}'] = ${cast(templateObject[key], key, options.component)}`
      )
    }
  })

  renderCode.push(`
    componentType = props[${counter}]['is'] || '${templateObject[Symbol.for('componentType')]}'

    components[${counter}]
    if(typeof componentType === 'string') {
      components[${counter}] = context.components && context.components[componentType] || components[componentType]
      if(!components[${counter}]) {
        throw new Error('Component "${templateObject[Symbol.for('componentType')]}" not found')
      }
    } else if(typeof componentType === 'function' && componentType[Symbol.for('isComponent')] === true) {
      components[${counter}] = componentType
    }

    ${elm} = components[${counter}].call(null, {props: props[${counter}]}, ${parent}, component)

    if (${elm}[Symbol.for('slots')][0]) {
      parent = ${elm}[Symbol.for('slots')][0]
      slotComponent = ${elm}
      inSlot = true
    } else {
      parent = ${elm}[Symbol.for('children')][0]
    }
  `)

  if (isDev === true) {
    const templateTagName = templateObject[Symbol.for('componentType')]
    const holderElm = options.key
      ? `elms[${holderCounter}][${options.key}]`
      : `elms[${holderCounter}]`
    const componentDisplayName = `typeof componentType === 'string'
      ? componentType
      : (componentType?.[Symbol.for('componentType')] || '${templateTagName}')`
    renderCode.push(`
      if (${holderElm} !== undefined && typeof ${holderElm}.setInspectorMetadata === 'function') {
        ${holderElm}.setInspectorMetadata({ 'blits-componentType': ${componentDisplayName} })
      }
    `)
  }

  this.cleanupCode.push(`components[${counter}] = null`)

  if (options.forloop) {
    renderCode.push('}')
  }

  if (children) {
    if (!options.forloop) {
      renderCode.push(`
        if(inSlot === true) {
          slotChildCounter = ${children.length}  + 1
        }
      `)
    }
    counter++
    generateElementCode.call(this, { children }, false, { ...options })
  }

  if (!options.forloop) {
    renderCode.push(`
      if (inSlot === true && slotChildCounter === 0) {
        inSlot = false
      }
    `)
  }
}

const generateForLoopCode = function (templateObject, parent) {
  const forLoop = templateObject[':for']
  delete templateObject[':for']
  const range = templateObject['range'] || templateObject[':range'] || '{}'
  delete templateObject['range']
  delete templateObject[':range']

  const key = templateObject['key']
  const forStartCounter = counter
  const forKey = interpolate(key, 'scope.')

  const shallow = !!!(
    templateObject['$shallow'] && templateObject['$shallow'].toLowerCase() === 'false'
  )
  delete templateObject['$shallow']

  delete templateObject['key']
  const regex = /(.+)\s+in\s+(.+)/gi
  //   const regex = /(:?\(*)(.+)\s+in\s+(.+)/gi

  const result = regex.exec(forLoop)

  // can be improved with a smarter regex
  const [item, index] = result[1]
    .replace('(', '')
    .replace(')', '')
    .split(/\s*,\s*/)

  const scopeRegex = new RegExp(`(scope\\.(?!${item}\\.|${index}|key)([\\w$]+))`, 'gi')

  // local context
  const ctx = {
    renderCode: [],
    effectsCode: [],
    cleanupCode: [],
    context: { props: [], components: this.components },
  }

  if (parent) {
    ctx.renderCode.push(`parent = ${parent}`)
  }

  // If the index variable is not defined, the key attribute would not reference it.
  if (index !== undefined) {
    const indexRegex = new RegExp(`\\$${index}(?!['\\w])`)
    const indexResult = indexRegex.exec(key)
    if (Array.isArray(indexResult)) {
      ctx.renderCode.push(
        `console.warn(" Using '${index}' in the key, like key=${key},  is not recommended")`
      )
    }
  }

  ctx.renderCode.push(`
    created[${forStartCounter}] = []
    effects[${forStartCounter}] = []

    let from${forStartCounter}
    let to${forStartCounter}

    forloops[${forStartCounter}] = (collection = [], elms, created) => {
      const rawCollection = getRaw(collection)
      const keys = new Set()
      let l = rawCollection.length

      const range = ${interpolate(range, 'component?.')} || {}
      from${forStartCounter} = range['from'] || 0
      to${forStartCounter} = 'to' in range ? range['to'] : rawCollection.length

      while(l--) {
        const ${item} = rawCollection[l]
  `)

  ctx.cleanupCode.push(`
    created[${forStartCounter}].length = 0
  `)

  // push reference of index variable
  if (index !== undefined) {
    ctx.renderCode.push(`
        const ${index} = l
    `)
  }
  ctx.renderCode.push(`
        if(l < to${forStartCounter} && l >= from${forStartCounter}) {
          keys.add('' +  ${interpolate(key, '') || 'l'})
        }
      }
  `)

  // keep track of the index in the render code so we can inject
  // the code that takes care of destroying elements (generated later on)
  // in the right spot
  const indexToInjectDestroyCode = ctx.renderCode.length

  ctx.renderCode.push(`
      created.length = 0
      const length = rawCollection.length

      component !== null && component[Symbol.for('removeGlobalEffects')](effects[${forStartCounter}])

     const effectsToRemove = new Set(effects[${forStartCounter}].slice(0))
      if (effectsToRemove.size > 0) {
        const componentEffects = component?.[Symbol.for('effects')] || []
        let writeIndex = 0
        for (let readIndex = 0; readIndex < componentEffects.length; readIndex++) {
          if (!effectsToRemove.has(componentEffects[readIndex])) {
            componentEffects[writeIndex++] = componentEffects[readIndex]
          }
        }
        componentEffects.length = writeIndex
      }

      effects[${forStartCounter}].length = 0
      for(let __index = 0; __index < length; __index++) {
        if(__index < from${forStartCounter} || __index >= to${forStartCounter}) continue
        let scope = Object.create(component)
        parent = ${parent}
        scope['${item}'] = rawCollection[__index]
  `)
  // If the index variable is declared, include it in the scope object
  if (index !== '') {
    ctx.renderCode.push(`
        scope['${index}'] = __index
    `)
  }
  ctx.renderCode.push(`
        scope['key'] = '' + ${forKey || '__index'}
  `)
  if ('ref' in templateObject && templateObject.ref.indexOf('$') === -1) {
    // automatically map the ref for each item in the loop based on the given ref key
    ctx.renderCode.push(`
        scope['__ref'] = '${templateObject.ref}' + __index
    `)
    templateObject.ref = '$__ref'
  }

  ctx.renderCode.push(`
        created.push(scope.key)
  `)

  if (
    templateObject[Symbol.for('componentType')] === 'Element' ||
    templateObject[Symbol.for('componentType')] === 'Slot' ||
    templateObject[Symbol.for('componentType')] === 'Text'
  ) {
    if (templateObject[Symbol.for('componentType')] === 'Text') {
      templateObject.__textnode = 'true'
    }
    generateElementCode.call(ctx, templateObject, parent, {
      key: 'scope.key',
      component: 'scope.',
      forceEffect: false,
      forloop: true,
    })
  } else {
    generateComponentCode.call(ctx, templateObject, false, {
      key: 'scope.key',
      component: 'scope.',
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
      scope = Object.assign(collection[__index], scope)
  `)
  }

  // inner scope variables are part of the main forloop
  innerScopeEffects.forEach((effect, index) => {
    const key = effect.indexOf(`scope.${index}`) > -1 ? `'${interpolate(result[2], '')}'` : null
    if (effect.indexOf("Symbol.for('props')") === -1) {
      ctx.renderCode.push(`
        let eff${index} = () => {
          ${effect}
        }
        effect(eff${index}, ${key})
        effects[${forStartCounter}].push(eff${index})
        component[Symbol.for('effects')].push(eff${index})
      `)
    } else {
      // props shouldn't be wrapped in an effect, but simply passed on
      ctx.renderCode.push(`
        ${effect}
      `)
    }
  })
  ctx.renderCode.push(`
    }
    return effects
  }`)

  // generate code that destroys items
  const destroyCode = []
  destroyCode.push(`
      let i = created.length

      while (i--) {
        if (keys.has(created[i]) === false) {
          const key = created[i]
  `)
  const forEndCounter = counter

  for (let i = forStartCounter; i <= forEndCounter; i++) {
    destroyCode.push(`
        elms[${i}][key] && elms[${i}][key].destroy()
        elms[${i}][key] = null
        delete elms[${i}][key]
    `)
  }
  destroyCode.push(`
      }
    }
  `)

  // inject the destroy code in the correct spot
  ctx.renderCode.splice(indexToInjectDestroyCode, 0, ...destroyCode)

  let effectKey = `${interpolate(result[2], '')}`

  // Get the last property from nested path
  if (effectKey && effectKey.includes('.')) {
    effectKey = effectKey.match(/[^.]+$/)[0]
  }

  // get the reference to range from and to
  const effectKeysRegex = /\$([^,} ]+)/g
  const effectKeys = [...range.matchAll(effectKeysRegex)].map((match) => `'${match[1]}'`)

  ctx.renderCode.push(`
    let eff${forStartCounter} = () => {
      forloops[${forStartCounter}](${cast(result[2], ':for')}, elms, created[${forStartCounter}])
    }

    component[Symbol.for('effects')].push(eff${forStartCounter})

    effect(eff${forStartCounter}, ['${effectKey}', ${effectKeys.join(',')}])
  `)

  ctx.cleanupCode.push(`
    eff${forStartCounter} = null
    // call loop with empty array
    forloops[${forStartCounter}]([], elms, created[${forStartCounter}])
    forloops[${forStartCounter}] = null
  `)

  outerScopeEffects.forEach((effect, outerScopeEffectsIndex) => {
    const matches = [...effect.matchAll(scopeRegex)]

    let l = matches.length
    const refs = []
    while (l--) {
      const match = matches[l]
      const ref = `component.${match[2]}`
      refs.indexOf(ref) === -1 && refs.push(ref)
      // don't update the effect to point to component, if we're referring to a scope item
      if (match[2] !== item) {
        effect =
          effect.substring(0, match.index) + ref + effect.substring(match.index + match[1].length)
      }
    }

    ctx.renderCode.push(`
      let eff${forStartCounter}_${outerScopeEffectsIndex} = () => {
        void ${refs.join(', ')}
        for(let __index = 0; __index < ${interpolate(result[2])}.length; __index++) {
          if(__index < from${forStartCounter} || __index >= to${forStartCounter}) continue
          const scope = {}
          scope['${index}'] = __index
          scope['${item}'] = ${interpolate(result[2])}[__index]
          scope['key'] = ${forKey || '__index'}
    `)
    ctx.cleanupCode.push(`eff${forStartCounter}_${outerScopeEffectsIndex} = null`)

    ctx.renderCode.push(`
          ${effect}
        }
      }
      component[Symbol.for('effects')].push(eff${forStartCounter}_${outerScopeEffectsIndex})
      effect(eff${forStartCounter}_${outerScopeEffectsIndex})
    `)
  })

  this.renderCode.push(ctx.renderCode.join('\n'))
  this.cleanupCode.push(ctx.cleanupCode.join('\n'))
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
          childTemplateObject[Symbol.for('componentType')] === 'Text' ||
          childTemplateObject[Symbol.for('componentType')] === 'Layout'
        ) {
          if (childTemplateObject[Symbol.for('componentType')] === 'Text') {
            childTemplateObject.__textnode = 'true'
          }
          if (childTemplateObject[Symbol.for('componentType')] === 'Layout') {
            childTemplateObject.__layout = 'true'
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
  else if (key !== 'color' && /[^0-9%\s.eE]/.test(val) === false && !isNaN(parseFloat(val))) {
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
    const trimmed = val.trim()
    if (/^\$?\w+$/.test(trimmed)) {
      const c = component.slice(0, -1)
      castedValue = `${c}['${trimmed.replace('$', '')}'] && ${c}['${trimmed.replace('$', '')}'].bind(${c})`
    } else {
      castedValue = interpolate(trimmed, component)
    }
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
