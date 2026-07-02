import type { AnnouncerDriver } from '@lightningjs/blits'

export interface WebOSRequestOptions {
  method: 'speak'
  parameters: {
    text: string
    clear: boolean
  }
  onFailure(error: any): void
}

export type WebOSRequest = (uri: string, options: WebOSRequestOptions) => any

export interface WebOSAnnouncerOptions {
  /**
   * webOS service request function. Defaults to `webOS.service.request` when available.
   */
  request?: WebOSRequest
  /**
   * webOS TTS service URI.
   *
   * @default 'luna://com.webos.service.tts'
   */
  uri?: string
  /**
   * Whether the platform TTS queue should be cleared before speaking.
   *
   * @default true
   */
  clear?: boolean
  /**
   * Optional failure callback for the webOS TTS request.
   */
  onFailure?: (error: any) => void
}

declare function createAnnouncer(options?: WebOSAnnouncerOptions): AnnouncerDriver

export default createAnnouncer
