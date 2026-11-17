import type { AnnouncerDriver } from '@lightningjs/blits'

export interface DOMAnnouncerOptions {
  /**
   * Document in which the live region is created. Defaults to the global document.
   */
  document?: Document | null
  /**
   * Element that receives the live region. Defaults to document.body.
   */
  container?: HTMLElement
  /**
   * ID used to find or create the single live region.
   *
   * @default 'blits-announcer'
   */
  id?: string
  /**
   * Delay between clearing the region and inserting the next message.
   *
   * @default 0
   */
  updateDelay?: number
}

declare function createAnnouncer(options?: DOMAnnouncerOptions): AnnouncerDriver

export default createAnnouncer
