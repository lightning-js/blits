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

class TemplateParseError extends Error {
  constructor(message, name, context) {
    super(`TemplateParseError: ${message}`)
    this.name = name
    this.context = context
  }
}

export default (template = '') => {
  let cursor = 0
  let tags = []
  let currentTag = null
  let currentLevel = 0

  // regular expressions
  const tagStartRegex = /^<\/?([a-zA-Z0-9_\-.]+)\s*/
  const tagEndRegex = /^\s*(\/?>)\s*/
  const attrNameRegex = /^([A-Za-z0-9:.\-_@]+)=\s*(["'])/
  const emptyTagStartRegex = /^<>\s*/
  const emptyTagEndRegex = /^\s*(<\/>)\s*/

  // main functions
  const parse = () => {
    template = clean(template)
    try {
      parseLoop(parseEmptyTagStart)
      return format(tags)
    } catch (error) {
      if (error instanceof TemplateParseError) {
        console.error(`${error.message} | ${error.name}`)
      } else {
        console.error(error)
      }
      // return errors gracefully
      return null
    }
  }

  const parseLoop = (next) => {
    if (cursor >= template.length) {
      return
    }
    next()
  }

  // utils
  const clean = (template) => {
    // remove all unnecessary new lines and comments
    return template
      .replace(/<!--.*?-->/gms, '') // remove comments
      .replace(/\r?\n\s*\r\n/gm, ' ') // remove empty lines
      .replace(/\r?\n\s*(\S)/gm, ' $1') // remove line endings & spacing
      .replace(/\r?\n/g, '') // remove all line endings
      .trim()
  }

  const moveCursorOnMatch = (regex) => {
    const match = template.slice(cursor).match(regex)
    if (match) cursor += match[0].length
    return match
  }

  // parsers
  const parseEmptyTagStart = () => {
    const match = moveCursorOnMatch(emptyTagStartRegex)
    if (match) {
      tags.push({ type: null, [symbols.type]: 'opening', [symbols.level]: currentLevel })
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
      tags.push({ type: null, [symbols.type]: 'closing', [symbols.level]: currentLevel })
      parseLoop(parseEmptyTagStart)
    } else {
      parseLoop(parseTag)
    }
  }

  const parseTag = () => {
    const match = moveCursorOnMatch(tagStartRegex)
    if (match) {
      if (match[0].startsWith('</')) {
        currentLevel--
        currentTag = { type: match[1], [symbols.type]: 'closing', [symbols.level]: currentLevel }
      } else {
        currentTag = { type: match[1], [symbols.type]: 'opening', [symbols.level]: currentLevel }
        currentLevel++
      }
      parseLoop(parseTagEnd)
    } else {
      throw new TemplateParseError('InvalidTag', template.slice(cursor))
    }
  }

  const parseTagEnd = () => {
    const match = moveCursorOnMatch(tagEndRegex)
    if (match) {
      if (match[1] === '/>') {
        if (currentTag[symbols.type] === 'closing') {
          // 10 is arbitrary, just to show some context by moving the cursor back a bit
          throw new TemplateParseError('InvalidClosingTag', template.slice(cursor - 10))
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

  const parseAttributes = () => {
    const attrNameMatch = moveCursorOnMatch(attrNameRegex)
    if (attrNameMatch) {
      const delimiter = attrNameMatch[2]
      const attrValueRegex = new RegExp(`^(.*?)${delimiter}\\s*`)
      const attrValueMatch = moveCursorOnMatch(attrValueRegex)

      if (attrValueMatch) {
        // maybe this should be done while code generation step
        const attr = formatAttribute(attrNameMatch[1], attrValueMatch[1])
        currentTag[attr.name] = attr.value
        parseLoop(parseTagEnd)
      } else {
        throw new TemplateParseError('MissingOrInvalidAttributeValue', template.slice(cursor))
      }
    } else {
      throw new TemplateParseError('InvalidAttribute', template.slice(cursor))
    }
  }

  const formatAttribute = (name, value) => {
    // if name contains a dot then we need to add enclosing js object to the value
    // example :x.transition="{v: $offset}" must be formatted as { name: ':x', value: '{ transition: {v: $offset}' }
    if (name.includes('.')) {
      const [objectName, attributeName] = name.split('.')
      return { name: objectName, value: `{${attributeName}: ${value}}` }
    }
    return { name, value }
  }

  // formating and validation

  /*
  validation rules:
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
          throw new TemplateParseError('MultipleTopLevelTags', formatErrorContext(element))
        }
        rootElementDefined = true
      }

      // Rule #2
      if (element[symbols.type] === 'opening') {
        stack.push({
          [symbols.level]: element[symbols.level],
          [symbols.type]: element[symbols.type],
          type: element.type,
          parent: currentParent, // helps getting the previous parent when closing tag is encountered
        })
      } else if (element[symbols.type] === 'closing') {
        const isStackEmpty = stack.length === 0
        let isLevelMismatch = false
        let isTagMismatch = false
        if (!isStackEmpty) {
          isLevelMismatch = stack[stack.length - 1][symbols.level] !== element[symbols.level]
          isTagMismatch = stack[stack.length - 1].type !== element.type
        }

        if (isStackEmpty || isLevelMismatch || isTagMismatch) {
          throw new TemplateParseError('MismatchedClosingTag', formatErrorContext(element))
        }

        // when we remove the closing element from the stack, we should set
        // the current parent to the parent of the closing element
        const lastTag = stack.pop()
        currentParent = lastTag.parent
      }

      const newItem = { ...element }
      delete newItem[symbols.type]
      delete newItem[symbols.level]

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
      const unclosedTags = stack
        .map((item) => {
          return formatErrorContext(item)
        })
        .join(', ')
      throw new TemplateParseError('UnclosedTags', unclosedTags)
    }

    function formatErrorContext(element) {
      return `${element.type || 'empty-tag'}[${element[symbols.type]}] at level ${
        element[symbols.level]
      }`
    }

    return output
  }

  return parse()
}
