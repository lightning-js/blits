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

// Utility function: Character-wise brace matcher that handles strings and comments
const findMatchingBrace = (text, startPos) => {
  let braceLevel = 1
  let position = startPos + 1
  let inString = false
  let stringChar = ''

  for (; position < text.length && braceLevel > 0; position++) {
    const char = text[position]

    // Handle string boundaries (ignore escaped quotes)
    if (!inString && (char === '"' || char === "'" || char === '`')) {
      inString = true
      stringChar = char
    } else if (inString && char === stringChar && text[position - 1] !== '\\') {
      inString = false
    }
    // Skip comments when not in strings
    else if (!inString && char === '/' && text[position + 1] === '/') {
      // Skip line comment
      const nextNewline = text.indexOf('\n', position + 2)
      position = nextNewline === -1 ? text.length - 1 : nextNewline
    } else if (!inString && char === '/' && text[position + 1] === '*') {
      // Skip block comment
      const end = text.indexOf('*/', position + 2)
      position = end === -1 ? text.length - 1 : end + 1
    }
    // Count braces only outside strings and comments
    else if (!inString) {
      if (char === '{') braceLevel++
      else if (char === '}') braceLevel--
    }
  }

  return braceLevel === 0 ? position : -1
}

// Find computed object boundaries in component config
const findComputedObjectEnd = (configObject, computedStart) => {
  return findMatchingBrace(configObject, computedStart)
}

// Find individual computed function boundaries
const findComputedFunctionEnd = (computedObj, openingBracePos) => {
  return findMatchingBrace(computedObj, openingBracePos)
}

// Skip whitespace + commas + comments (line and block) starting from `pos`, return next code position.
const skipNonCode = (text, pos) => {
  let p = pos
  while (p < text.length) {
    const c = text[p]

    // whitespace
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      p++
      continue
    }

    // separators between object members
    if (c === ',') {
      p++
      continue
    }

    // line comment
    if (c === '/' && text[p + 1] === '/') {
      const nextNewline = text.indexOf('\n', p + 2)
      p = nextNewline === -1 ? text.length : nextNewline + 1
      continue
    }

    // block comment
    if (c === '/' && text[p + 1] === '*') {
      const end = text.indexOf('*/', p + 2)
      p = end === -1 ? text.length : end + 2
      continue
    }

    return p
  }

  return p
}

export default (code) => {
  // Find component declarations
  const componentRegex =
    /Blits\.(Component|Application)\s*\(\s*(?:'[^']*'|"[^"]*")?\s*(?:,\s*)?({[\s\S]*?})\s*\)/g
  const modifications = []
  const commentText = ' /* auto-generated reactivity guard */ '

  let match
  while ((match = componentRegex.exec(code)) !== null) {
    const configObject = match[2]

    // Find computed section with proper brace balancing
    const computedKeywordMatch = /computed\s*:\s*{/.exec(configObject)

    if (computedKeywordMatch) {
      // Find start position of the computed block
      const computedStart = computedKeywordMatch.index + computedKeywordMatch[0].length - 1 // Position of the opening brace

      // Find the matching closing brace for computed object in config
      const computedEnd = findComputedObjectEnd(configObject, computedStart)

      if (computedEnd !== -1) {
        const computedObj = configObject.substring(computedStart, computedEnd)
        const computedBlockStart = computedKeywordMatch.index
        const computedBlockEnd = computedEnd

        // Process each computed property
        const computedProps = []
        let currentPos = 1 // Start after the opening brace

        // Process computed properties content
        // intentionally not using regexes to extract functions and their content
        // using cursor-based parsing gives better accuracy
        while (currentPos < computedObj.length - 1) {
          // -1 to exclude the closing brace
          // Skip whitespace/comments so we don't match commented-out computed functions
          currentPos = skipNonCode(computedObj, currentPos)
          if (currentPos >= computedObj.length - 1) break

          // Find the next function name (computed properties are `name() { ... }`)
          const functionNameMatch = /^(\w+)\s*\(\)\s*/.exec(computedObj.substring(currentPos))
          if (!functionNameMatch) break

          const funcName = functionNameMatch[1]
          const funcNamePos = currentPos

          // Find opening brace for this function
          const afterSignaturePos = funcNamePos + functionNameMatch[0].length
          const openingBracePos = computedObj.indexOf('{', afterSignaturePos)
          if (openingBracePos === -1) break

          // Find closing brace for individual computed function
          const closingBracePos = findComputedFunctionEnd(computedObj, openingBracePos)

          if (closingBracePos === -1) {
            break
          }

          // Extract the entire function and its body
          // This is better and more accurate than using regex to avoid nested braces
          const functionStartPos = funcNamePos
          const functionEndPos = closingBracePos
          const fullFunction = computedObj.substring(functionStartPos, functionEndPos)
          const functionBody = computedObj
            .substring(openingBracePos + 1, closingBracePos - 1)
            .trim()

          computedProps.push({
            name: funcName,
            fullText: fullFunction,
            body: functionBody,
            startPos: functionStartPos,
            endPos: functionEndPos,
          })

          // Move past this function
          currentPos = closingBracePos
        }

        // Store the original computed object for later replacement
        const originalComputedObj = configObject.substring(computedBlockStart, computedBlockEnd)
        const computedObjOffsetInOriginal = computedStart - computedBlockStart
        const computedObjEndInOriginal = computedObjOffsetInOriginal + computedObj.length

        let modifiedComputedObj = originalComputedObj
        let hasChanges = false

        const replacements = []

        for (const prop of computedProps) {
          const thisRefs = extractThisReferences(prop.body)

          if (thisRefs.size > 0) {
            // Skip if already modified
            if (
              prop.body.includes(commentText) ||
              Array.from(thisRefs).some((ref) => prop.body.startsWith(ref))
            ) {
              continue
            }

            // reactivity code
            const refCode = Array.from(thisRefs)
              .map((ref) => `${ref};`)
              .join(' ')

            // replacement with the same whitespace
            const openBraceIndex = prop.fullText.indexOf('{')

            if (openBraceIndex !== -1) {
              // Extract indentation from the original function body
              const indentMatch = prop.body.match(/^(\s+)/)
              const indent = indentMatch ? indentMatch[1] + '  ' : '    ' // Default to 4 spaces if no indent found

              const modifiedPropText =
                prop.fullText.substring(0, openBraceIndex + 1) +
                '\n' +
                indent +
                commentText +
                '\n' +
                indent +
                refCode +
                '\n' +
                indent +
                prop.body +
                '\n' +
                prop.fullText.substring(0, openBraceIndex).match(/^(\s*)/)[0] +
                '}'

              replacements.push({
                start: prop.startPos,
                end: prop.endPos,
                text: modifiedPropText,
              })
            }
          }
        }

        if (replacements.length > 0) {
          let modifiedComputedInner = computedObj

          replacements.sort((a, b) => b.start - a.start)
          for (const r of replacements) {
            modifiedComputedInner =
              modifiedComputedInner.slice(0, r.start) + r.text + modifiedComputedInner.slice(r.end)
          }

          modifiedComputedObj =
            originalComputedObj.slice(0, computedObjOffsetInOriginal) +
            modifiedComputedInner +
            originalComputedObj.slice(computedObjEndInOriginal)
          hasChanges = true
        }

        if (hasChanges) {
          // Store the modification of the entire computed object
          modifications.push({
            original: originalComputedObj,
            replacement: modifiedComputedObj,
          })
        }
      }
    }
  }

  // Apply all modifications at once, from last to first to preserve positions
  if (modifications.length > 0) {
    let modifiedCode = code
    // Sort modifications from last to first to avoid position changes
    modifications.sort((a, b) => {
      const posA = modifiedCode.indexOf(a.original)
      const posB = modifiedCode.indexOf(b.original)
      return posB - posA
    })

    for (const mod of modifications) {
      modifiedCode = modifiedCode.replace(mod.original, mod.replacement)
    }

    // Returning code without a source map
    // Vite will automatically chain this with the next plugin's source map (preCompiler)
    return {
      code: modifiedCode,
      map: { mappings: '' },
    }
  }

  return null
}

const extractThisReferences = (funcBody) => {
  const thisRefs = new Set()

  // Find all this.X references, but exclude method calls
  const refRegex = /this\.\w+(?!\s*\()/g // matches this.X but not this.X() or this.X.Y()
  let refMatch

  while ((refMatch = refRegex.exec(funcBody)) !== null) {
    const fullRef = refMatch[0]

    // Extract just the variable part (this.X)
    // We need to avoid method calls or chained methods
    const varRef = fullRef.split('.').slice(0, 2).join('.')

    // Don't add if it's part of a method call
    if (
      !funcBody
        .substring(refMatch.index)
        .match(new RegExp(`^${varRef.replace(/\./g, '\\.')}\\s*\\(`))
    ) {
      thisRefs.add(varRef)
    }
  }

  return thisRefs
}
