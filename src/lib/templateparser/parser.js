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

import symbols from '../symbols.js'
import colors from '../colors/colors.js'

export default (template = '', componentName, parentComponent, filePath = null) => {
  let cursor = 0
  let prevCursor = 0
  let tags = []
  let currentTag = null
  let currentLevel = 0

  // regular expressions
  const tagStartRegex = /^<\/?([a-zA-Z0-9_\-.]+)\s*/
  const tagEndRegex = /^\s*(\/?>)\s*/
  const attrNameRegex = /^([A-Za-z0-9:.\-_@$]+)=\s*(["'])/
  const emptyTagStartRegex = /^<>\s*/
  const emptyTagEndRegex = /^\s*(<\/>)\s*/

  // main functions
  const parse = () => {
    template = clean(template)
    try {
      parseLoop(parseEmptyTagStart)
      return format(tags)
    } catch (error) {
      if (error.name == 'TemplateParseError' || error.name == 'TemplateStructureError') {
        error.message = `${error.message}\n${error.context}`
      }
      throw error
    }
  }

  const parseLoop = (next) => {
    if (cursor >= template.length) {
      return
    }
    next()
  }

  // utils
  const clean = (templateText) => {
    // remove all unnecessary new lines and comments
    return templateText
      .replace(/<!--.*?-->/gms, '') // remove comments
      .replace(/\r?\n\s*\r\n/gm, ' ') // remove empty lines
      .replace(/\r?\n\s*(\S)/gm, ' $1') // remove line endings & spacing
      .replace(/\r?\n/g, '') // remove all line endings
      .trim()
  }

  const moveCursorOnMatch = (regex) => {
    const match = template.slice(cursor).match(regex)
    if (match) {
      prevCursor = cursor
      cursor += match[0].length
    }
    return match
  }

  // parsers
  const parseEmptyTagStart = () => {
    const match = moveCursorOnMatch(emptyTagStartRegex)
    if (match) {
      tags.push({
        [Symbol.for('componentType')]: null,
        [symbols.type]: 'opening',
        [symbols.level]: currentLevel,
        [symbols.cursorTagStart]: prevCursor,
      })
      currentLevel++
      parseLoop(parseEmptyTagStart)
    } else {
      parseLoop(parseEmptyTagEnd)
    }
  }

  const parseEmptyTagEnd = () => {
    const match = moveCursorOnMatch(emptyTagEndRegex)
    if (match) {
      currentLevel--
      tags.push({
        [Symbol.for('componentType')]: null,
        [symbols.type]: 'closing',
        [symbols.level]: currentLevel,
      })
      parseLoop(parseEmptyTagStart)
    } else {
      parseLoop(parseTag)
    }
  }

  const parseTag = () => {
    const match = moveCursorOnMatch(tagStartRegex)
    if (match) {
      currentTag = {
        [Symbol.for('componentType')]: match[1],
        [symbols.level]: currentLevel,
        [symbols.cursorTagStart]: prevCursor,
      }
      if (match[0].startsWith('</')) {
        currentLevel--
        currentTag[symbols.type] = 'closing'
        currentTag[symbols.level] = currentLevel
      } else {
        currentTag[symbols.type] = 'opening'
        currentLevel++
      }
      parseLoop(parseTagEnd)
    } else {
      throw TemplateParseError('InvalidTag')
    }
  }

  const parseTagEnd = () => {
    const match = moveCursorOnMatch(tagEndRegex)
    if (match) {
      if (match[1] === '/>') {
        if (currentTag[symbols.type] === 'closing') {
          throw TemplateParseError('InvalidClosingTag')
        }
        currentTag[symbols.type] = 'self-closing'
        currentLevel-- // because it was parsed as opening tag before
      }

      // parsing content in between tags
      // rule: < char cannot be used in between tags even in escaped form
      if (currentTag[symbols.type] === 'opening') {
        const tagContent = template.slice(cursor, template.indexOf('<', cursor))
        if (tagContent) {
          currentTag.content = tagContent
          cursor += tagContent.length
        }
      }

      tags.push(currentTag)
      parseLoop(parseEmptyTagStart)
    } else {
      parseLoop(parseAttributes)
    }
  }

  //fixme: closing tags cannot have attributes
  const parseAttributes = () => {
    const attrNameMatch = moveCursorOnMatch(attrNameRegex)
    if (attrNameMatch) {
      if (currentTag[symbols.type] === 'closing') {
        throw TemplateParseError('AttributesInClosingTag')
      }

      const delimiter = attrNameMatch[2]
      const attrValueRegex = new RegExp(`^(.*?)${delimiter}\\s*`)
      const attrValueMatch = moveCursorOnMatch(attrValueRegex)

      if (attrValueMatch) {
        // maybe this should be done while code generation step
        const attr = formatAttribute(attrNameMatch[1], attrValueMatch[1])
        currentTag[attr.name] = attr.value
        parseLoop(parseTagEnd)
      } else {
        throw TemplateParseError('MissingOrInvalidAttributeValue')
      }
    } else {
      throw TemplateParseError('InvalidAttribute')
    }
  }

  const formatAttribute = (name, value) => {
    // if name contains a dot then we need to add enclosing js object to the value
    // example :x.transition="{v: $offset}" must be formatted as { name: ':x', value: '{ transition: {v: $offset}' }
    if (name.includes('.')) {
      const [objectName, attributeName] = name.split('.')
      return { name: objectName, value: `{${attributeName}: ${value}}` }
    }

    // process color values
    if (['color', ':color', ':effects', 'effects'].includes(name)) {
      return processColors(name, value)
    }
    return { name, value }
  }

  const processColors = (name, value) => {
    let newValue = value //copy for processing
    let normalized = colors.normalize(newValue, null)

    if (normalized === null) {
      const stringTokenRegex = /'([^']+)'/g
      let match
      let lastIndex = 0
      let result = ''

      while ((match = stringTokenRegex.exec(value)) !== null) {
        const potentialColor = match[1]
        const matchIndex = match.index
        const matchLength = match[0].length

        result += value.slice(lastIndex, matchIndex)
        normalized = colors.normalize(potentialColor, null)

        if (normalized === null) {
          result += value.slice(matchIndex, matchIndex + matchLength)
        } else {
          result += `'${normalized}'`
        }

        lastIndex = matchIndex + matchLength
      }

      result += value.slice(lastIndex)
      newValue = result
    } else {
      newValue = normalized
    }

    return { name, value: newValue }
  }

  /*
  Formatting & validation rules:
    #1: Every opening tag must have a corresponding closing tag at the same level. If a closing tag is encountered without
        a preceding opening tag at the same level, or if an opening tag is not followed by a corresponding closing tag at
        the same level, an error should be thrown.
    #2: There must be exactly one top-level element (an element at level 0). This element may either be a self-closing
        element or an opening tag followed by a closing tag. If more than one top-level element is encountered, an error
        should be thrown.
  */
  const format = (parsedData) => {
    let stack = []
    let rootElementDefined = false
    let output = { children: [] }
    let currentParent = output

    for (let i = 0; i < parsedData.length; i++) {
      let element = parsedData[i]

      // Rule #1
      if (element[symbols.level] === 0 && element[symbols.type] !== 'closing') {
        if (rootElementDefined) {
          throw TemplateStructureError('MultipleTopLevelTags', element)
        }
        rootElementDefined = true
      }

      // Rule #2
      if (element[symbols.type] === 'opening') {
        stack.push({
          [symbols.level]: element[symbols.level],
          [symbols.type]: element[symbols.type],
          [symbols.cursorTagStart]: element[symbols.cursorTagStart],
          [Symbol.for('componentType')]: element[Symbol.for('componentType')],
          parent: currentParent, // helps getting the previous parent when closing tag is encountered
        })
      } else if (element[symbols.type] === 'closing') {
        const isStackEmpty = stack.length === 0
        let isLevelMismatch = false
        let isTagMismatch = false
        if (!isStackEmpty) {
          isLevelMismatch = stack[stack.length - 1][symbols.level] !== element[symbols.level]
          isTagMismatch =
            stack[stack.length - 1][Symbol.for('componentType')] !==
            element[Symbol.for('componentType')]
        }

        if (isStackEmpty || isLevelMismatch || isTagMismatch) {
          throw TemplateStructureError('MismatchedClosingTag', element)
        }

        // when we remove the closing element from the stack, we should set
        // the current parent to the parent of the closing element
        const lastTag = stack.pop()
        currentParent = lastTag.parent
      }

      const newItem = { ...element }
      delete newItem[symbols.type]
      delete newItem[symbols.level]
      delete newItem[symbols.cursorTagStart]

      // if it is an opening tag, add children[] to it and update current parent
      if (element[symbols.type] === 'opening') {
        // make sure the current opening tag has really a child element
        if (i + 1 < parsedData.length && parsedData[i + 1][symbols.type] !== 'closing') {
          newItem.children = []
        }
        currentParent.children.push(newItem)
        currentParent = newItem
      } else if (element[symbols.type] === 'self-closing') {
        currentParent.children.push(newItem)
      }
    }

    // Check if all tags are closed (so stack should be empty)[Rule #1]
    if (stack.length > 0) {
      throw TemplateStructureError('UnclosedTags', stack)
    }

    return output
  }

  // error reporting
  const contextPaddingBefore = 10 // number of characters to show before the error location
  const contextPaddingAfter = 50 // number of characters to show after the error location

  const TemplateParseError = (message) => {
    const location = getErrorLocation()
    message = `${message} in ${location}`

    const error = new Error(message)
    error.name = 'TemplateParseError'

    const start = Math.max(0, prevCursor - contextPaddingBefore)
    const end = Math.min(template.length, cursor + contextPaddingAfter)
    const contextText = template.slice(start, end)

    // add ^ caret to show where the error is
    const caretPosition = cursor - start
    error.context = insertContextCaret(caretPosition, contextText)

    return error
  }

  const TemplateStructureError = (message, context) => {
    const location = getErrorLocation()
    message = `${message} in ${location}`

    const error = new Error(message)
    error.name = 'TemplateStructureError'

    // check if context is an array
    if (Array.isArray(context)) {
      error.context = context.map((tag) => generateContext(tag)).join('\n')
    } else {
      error.context = generateContext(context)
    }

    function generateContext(element) {
      const start = Math.max(0, element[symbols.cursorTagStart] - contextPaddingBefore)
      const contextText = template.slice(start, start + contextPaddingAfter)
      // add ^ caret to show where the error is
      return insertContextCaret(contextPaddingBefore, contextText)
    }
    return error
  }

  const insertContextCaret = (position, contextText) => {
    const caret = ' '.repeat(position) + '^'
    return `\n${contextText}\n${caret}\n`
  }

  const getErrorLocation = () => {
    if (parentComponent) {
      let hierarchy = componentName || ''
      let currentParent = parentComponent

      while (currentParent) {
        hierarchy = `${currentParent[Symbol.for('componentType')]}/${hierarchy}`
        currentParent = currentParent.parent
      }
      return hierarchy
    }
    return filePath ? filePath : 'Blits.Application'
  }

  return parse()
}
