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

class TemplateParseError extends Error {
  constructor(name, context) {
    super('TemplateParseError')
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
    parseLoop(parseEmptyTagStart)

    try {
      return format(tags)
    } catch (error) {
      console.error('Error:', error.message)
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
      tags.push({ type: null, __type: 'opening', __level: currentLevel })
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
      tags.push({ type: null, __type: 'closing', __level: currentLevel })
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
        currentTag = { type: match[1], __type: 'closing', __level: currentLevel }
      } else {
        currentTag = { type: match[1], __type: 'opening', __level: currentLevel }
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
        currentTag.__type = 'self-closing'
        currentLevel-- // because it was parsed as opening tag before
      }

      // parsing content in between tags
      // rule: < char cannot be used in between tags even in escaped form
      if (currentTag.__type === 'opening') {
        // fixme: we should discuss the name of this property
        const tagContent = template.slice(cursor, template.indexOf('<', cursor))
        if (tagContent) {
          currentTag._innerText = tagContent
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

  // formatter
  function format(data) {
    let stack = []
    let output = { children: [] }

    for (const item of data) {
      const { type, __type, __level } = item

      // Check for unclosed tags
      while (stack.length && stack[stack.length - 1].__level >= __level) {
        const popped = stack.pop()
        if (popped.__type === 'opening') {
          throw new TemplateParseError('MismatchedClosingTag', `tag: ${popped.type || 'null'}`)
        }
      }

      // For closing tags, just pop the opening tag from stack and continue
      if (__type === 'closing') {
        let lastStackType = stack[stack.length - 1] ? stack[stack.length - 1].type : null

        if (
          stack.length === 0 ||
          (type
            ? lastStackType && lastStackType.toLowerCase() !== type.toLowerCase()
            : lastStackType !== null)
        ) {
          throw new TemplateParseError('MismatchedClosingTag', `tag: ${type || 'null'}`)
        }
        stack.pop()
        continue
      }

      // Create a new item, copying properties but deleting __type and __level
      const newItem = { ...item }
      delete newItem.__type
      delete newItem.__level

      if (__type === 'opening') {
        newItem.children = []
      }

      // Find out where to insert this new item
      let current = output.children
      for (const stackItem of stack) {
        if (stackItem.children) {
          current = stackItem.children
        }
      }

      // Insert the item and push it to the stack
      current.push(newItem)
      stack.push(newItem)

      // If this is a self-closing tag, immediately pop it off the stack
      if (__type === 'self-closing') {
        stack.pop()
      }
    }

    // Check for any remaining unclosed tags
    for (const item of stack) {
      if (item.__type === 'opening') {
        throw new TemplateParseError('MismatchedClosingTag', `tag: ${item.type || 'null'}`)
      }
    }

    // Remove empty 'children' arrays
    function removeEmptyChildren(obj, level = 0) {
      if (Array.isArray(obj.children) && obj.children.length === 0 && level > 0) {
        delete obj.children
      }
      if (obj.children) {
        obj.children.forEach((child) => removeEmptyChildren(child, level + 1))
      }
    }

    removeEmptyChildren(output)
    return output
  }

  return parse()
}
