let counter

export default function (templateObject = { children: [] }) {
  const ctx = {
    renderCode: ['const elms = []'],
    effectsCode: [],
    context: { props: [], components: this.components },
  }

  counter = 0
  generateCode.call(ctx, templateObject)
  ctx.renderCode.push('return elms')

  console.log('RENDER code', ctx.renderCode.join('\n'))
  console.log('EFFECTS code', ctx.effectsCode.join('\n--------------------\n'))

  return {
    render: new Function('parent', 'component', 'context', ctx.renderCode.join('\n')),
    effects: ctx.effectsCode.map((code) => new Function('component', 'elms', 'context', code)),
    context: ctx.context,
  }
}

const generateElementCode = function (
  templateObject,
  parent = false,
  options = { counter: false, component: 'component.', forceEffect: false }
) {
  const renderCode = options.forceEffect ? this.effectsCode : this.renderCode
  if (parent) {
    renderCode.push(`parent = ${parent}`)
  }

  renderCode.push(`
    elms[${options.counter} || ${counter}] = this.element({boltId: component.___id, parentId: parent && parent.nodeId || 'root'})
    const elementConfig${counter} = {}
  `)

  const children = templateObject['children']
  delete templateObject['children']

  Object.keys(templateObject).forEach((key) => {
    if (key === 'type') return

    if (isReactiveKey(key)) {
      this.effectsCode.push(
        `elms[${counter}].set('${key.substring(1)}', ${interpolate(
          templateObject[key],
          options.component
        )})`
      )
    } else {
      renderCode.push(
        `elementConfig${counter}['${key}'] = ${cast(templateObject[key], key, options.component)}`
      )
    }
  })
  renderCode.push(`elms[${counter}].populate(elementConfig${counter})`)

  if (children) {
    generateCode.call(this, { children }, `elms[${counter}]`)
  }
}

const generateComponentCode = function (
  templateObject,
  parent = false,
  options = { counter: false, component: 'component.', forceEffect: false }
) {
  generateElementCode.call(this, templateObject, parent, options)
  parent = `elms[${counter}]`

  counter++

  const renderCode = options.forceEffect ? this.effectsCode : this.renderCode
  if (parent) {
    renderCode.push(`parent = ${parent}`)
  }

  renderCode.push(`const props${counter} = {}`)
  Object.keys(templateObject).forEach((key) => {
    if (key === 'type') return
    if (isReactiveKey(key)) {
      this.effectsCode.push(`
        elms[${counter}].___props['${key.substring(1)}'] = ${interpolate(
        templateObject[key],
        options.component
      )}
      `)
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
    elms[${counter}] = (context.components && context.components['${templateObject.type}'] || component.___components['${templateObject.type}'] || (() => { console.log('component ${templateObject.type} not found')})).call(null, {props: props${counter}}, parent, component)
  `)
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
    effectsCode: [],
    context: { props: [], components: this.components },
  }

  if (parent) {
    ctx.effectsCode.push(`parent = ${parent}`)
  }
  ctx.effectsCode.push(`
    const collection = ${cast(result[2], ':for')}
    for(let ${index} = 0; ${index} < collection.length; ${index}++) {
      const ${item} = collection[${index}]
  `)

  if (templateObject.type !== 'Element') {
    generateComponentCode.call(ctx, templateObject, false, {
      counter: 'index',
      component: '',
      forceEffect: true,
    })
  } else {
    generateElementCode.call(ctx, templateObject, parent, {
      counter: 'index',
      component: '',
      forceEffect: true,
    })
  }
  ctx.effectsCode.push('}')

  this.effectsCode.push(ctx.effectsCode.join('\n'))
}

const generateCode = function (templateObject, parent = false) {
  templateObject.children.forEach((childTemplateObject) => {
    counter++

    if (Object.keys(childTemplateObject).indexOf(':for') > -1) {
      generateForLoopCode.call(this, childTemplateObject, parent)
    } else {
      if (childTemplateObject.type !== 'Element') {
        generateComponentCode.call(this, childTemplateObject, parent)
      } else {
        generateElementCode.call(this, childTemplateObject, parent)
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

  // numeric
  if (key !== 'color' && !isNaN(parseFloat(val))) {
    castedValue = parseFloat(val)
  }
  // boolean true
  else if (val.toLowerCase() === 'true') {
    castedValue = true
  }
  // boolean false
  else if (val.toLowerCase() === 'false') {
    castedValue = false
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
