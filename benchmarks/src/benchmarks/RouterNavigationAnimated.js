import { fadeInOut } from '@lightningjs/blits/transitions'
import { createRouterNavigation } from './RouterNavigation.js'

export const title = 'Router navigation benchmark (animated)'

// The router's default page transition, as used by most apps.
export default createRouterNavigation(fadeInOut)
