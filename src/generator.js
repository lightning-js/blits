let counter

export default function (templateObject = { children: [] }) {
  const context = { props: [] }
  const renderCode = ['const elms = []']
  const effectsCode = []

  counter = 0
  templateObject.children.forEach((child) => {
    generateElementCode(child, renderCode, effectsCode, false, this, context)
  })

  renderCode.push('return elms')

  return {
    render: new Function('parent', 'component', 'context', renderCode.join('\n')),
    effects: effectsCode.map((code) => new Function('component', 'elms', 'context', code)),
    context,
  }
}

const generateElementCode = (tpl, renderCode, effectsCode, parent, scope, context) => {
  counter++

  if (parent) {
    renderCode.push(`parent = ${parent}`)
  }

  renderCode.push(`
    elms[${counter}] = this.element({boltId: component.___id, parentId: parent && parent.id() || 2})
    const elementConfig${counter} = {}
  `)

  parent = `elms[${counter}]`

  const children = tpl['children']
  delete tpl['children']

  Object.keys(tpl).forEach((key) => {
    if (key.indexOf(':') === 0) {
      effectsCode.push(interpolate`${counter} ${key} ${tpl[key]}`)
    } else {
      renderCode.push(cast`${counter} ${key} ${tpl[key]}`)
    }
  })

  renderCode.push(`elms[${counter}].populate(elementConfig${counter})`)

  if (children) {
    children.forEach((child) => {
      if (
        child.type &&
        child.type !== 'Component' &&
        child.type !== 'Element' &&
        scope &&
        scope.components &&
        scope.components[child.type]
      ) {
        counter++
        if (!context[child.type]) {
          context[child.type] = scope.components[child.type]
        }

        context.props.push({ props: child })

        Object.keys(child).forEach((key) => {
          const val = child[key]
          // interpolate this better!
          if (typeof val === 'string' && val.startsWith('$')) {
            if (key.startsWith(':')) {
              key = key.substring(1)
            }
            renderCode.push(
              `context.props[${context.props.length - 1}].props.${key} = component.${val.substring(
                1
              )} `
            )
          }
        })

        renderCode.push(`
          elms[${counter}] = context['${child.type}'].call(null, context.props[${
          context.props.length - 1
        }], ${parent})
          `)
      } else {
        generateElementCode(child, renderCode, effectsCode, `${parent}`, scope, context)
      }
    })
  }
}

const normalizeColor = (color) => {
  if (!color.startsWith('0x')) {
    color = '0x' + (color.length === 6 ? 'ff' + color : color)
  }
  return color
}

const interpolate = (str, counter, key, val) => {
  key = key.substring(1)
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
  val = val.replace(replaceDollar, 'component.')

  // restore string replacemenet
  restore.forEach((el, idx) => {
    val = val.replace(`[@@REPLACEMENT${idx}@@]`, el)
  })

  return `elms[${counter}].set('${key}', ${val})`
}

const cast = (str, counter, key, val) => {
  let castedValue

  // colors
  if (key === 'color' && !val.startsWith('$')) {
    castedValue = normalizeColor(val)
  }
  // numeric
  else if (!isNaN(parseFloat(val))) {
    castedValue = parseFloat(val)
  }
  // boolean true
  else if (val.toLowerCase() === 'true') {
    castedValue = true
  }
  // boolean false
  else if (val.toLowerCase === 'false') {
    castedValue = false
  }
  // dynamic value
  else if (val.startsWith('$')) {
    castedValue =
      key === 'color'
        ? `this.normalizeARGB(component.${val.replace('$', '')})`
        : `component.${val.replace('$', '')}`
  }
  // static string
  else {
    castedValue = `"${val}"`
  }

  // reactive value (for now just remove the colons, rethink this part to be more efficient!)
  if (key.startsWith(':')) {
    key = key.substring(1)
    if (key === 'show') {
      key = 'alpha'
      castedValue = `(${castedValue})  ? 1 : 0.000001`
    }
    return `elms[${counter}].set('${key}', ${castedValue})`
  }

  return `elementConfig${counter}['${key}'] = ${castedValue}`
}
