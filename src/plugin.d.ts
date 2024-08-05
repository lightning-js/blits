
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

declare namespace Plugin {

  interface Plugin {
    /**
     * Name of the plugin. The plugin will be accessible on each Component's
     * `this` scope under this name, prefixed with a `$` (i.e. myplugin => `this.$myplugin`)
     */
    name: string,
    /**
     * Singleton function that will be used to instantiate the plugin.
     * Should do all necessary setup and ideally return an object with
     * properties or methods that can be used in the App
     */
    plugin: () => any
  }

}


/**
 * Blits.Plugin()
 *
 * Method to register a plugin
 */
declare function Plugin(
  /**
   * Plugin object or singleton function that will be used to instantiate the
   * plugin. Should do all necessary setup and ideally return an object with
   * properties or methods that can be used in the App
   */
  plugin: Plugin.Plugin | (() => any),
  /**
   * Name of the plugin or options object, to be passed into the plugin instantiation.
   *
   * When passing a string, the value will be used as **name** of the plugin. The plugin
   * will be accessible on each Component's `this` scope under this name, prefixed with a `$`
   * (i.e. myplugin => `this.$myplugin`)
   *
   * Passing a name is **required** when `plugin` argument is a singleton function
   *
   * When passing an object, the value will be considered to be an `options` object.
   * The options object will be passed into the plugin instantiation method. Can
   * be used to set default values
   */
  nameOrOptions?: string | object,
  /**
   * Object with options to be passed into the plugin instantiation method.
   * Can be used to set default values
   */
  options?: object
) : void

export default Plugin;
