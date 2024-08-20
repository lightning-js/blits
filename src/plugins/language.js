/*
 * Copyright 2024 Comcast Cable Communications Management, LLC
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

import fetchJson from '../helpers/fetchJson'
import { Log } from '../lib/log'
import { reactive } from '../lib/reactivity/reactive'

export default {
  name: 'language',
  plugin(options = {}) {
    let translations = {}
    let dictionary = {}

    const state = reactive({
      language: '',
      loaded: 0,
    })

    const setLanguage = (language) => {
      // define the dictionary
      dictionary = translations[language] || {}
      // set the current language in the reactive state
      state.language = language

      // warnings
      if (Object.keys(translations).length === 0) {
        Log.warn(
          'No translations loaded. Please load a file with translations or specify a translations object manually'
        )
      }
      if (language in translations === false) {
        Log.warn(`Language ${language} not available in the loaded translations`)
      }
    }

    const loadLanguageFile = (filePath) => {
      return fetchJson(filePath)
        .then((result) => {
          setTranslations(result)
        })
        .catch((e) => {
          Log.error(e)
        })
    }

    const setTranslations = (translationsObject) => {
      translations = translationsObject
      dictionary = translations[state.language] || {}
      state.loaded++
    }

    if ('file' in options) {
      loadLanguageFile(options.file).then(() => {
        if ('language' in options) {
          setLanguage(options.language)
        }
      })
    } else if ('language' in options) {
      setLanguage(options.language)
    }

    // Public API language plugin
    return {
      translate(key) {
        // reference state.language, to trigger reactive effects for
        // translate functions when language is modified
        state.language

        // reference state.loaded, to trigger reactive effects for
        // translate functions when language is modified
        state.loaded

        let replacements = [...arguments].slice(1)

        // no replacements so just translated string
        if (replacements.length === 0) {
          return (dictionary && dictionary[key]) || key
        } else {
          if (replacements.length === 1 && typeof replacements[0] === 'object') {
            replacements = replacements.pop()
          }

          return Object.keys(
            // maps array input to an object {0: 'item1', 1: 'item2'}
            Array.isArray(replacements) ? Object.assign({}, replacements) : replacements
          ).reduce((text, replacementKey) => {
            return text.replace(
              new RegExp('{\\s?' + replacementKey + '\\s?}', 'g'),
              replacements[replacementKey]
            )
          }, (dictionary && dictionary[key]) || key)
        }
      },
      get language() {
        return state.language
      },
      set(language) {
        setLanguage(language)
      },
      translations(translationsObject) {
        setTranslations(translationsObject)
      },
      load(file) {
        return loadLanguageFile(file)
      },
    }
  },
}
