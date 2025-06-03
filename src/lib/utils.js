/**
 * A mapping of common screen resolution names to their scale factors relative to 1080p (Full HD).
 *
 * @type {Object<string|number, number>}
 * @property {number} hd - 0.666... (720p)
 * @property {number} '720p' - 0.666... (720p)
 * @property {number} 720 - 0.666... (720p)
 * @property {number} fhd - 1 (Full HD)
 * @property {number} fullhd - 1 (Full HD)
 * @property {number} '1080p' - 1 (Full HD)
 * @property {number} 1080 - 1 (Full HD)
 * @property {number} '4k' - 2 (2160p)
 * @property {number} '2160p' - 2 (2160p)
 * @property {number} 2160 - 2 (2160p)
 */
export const screenResolutions = {
  hd: 0.66666667,
  '720p': 0.66666667,
  720: 0.66666667,
  fhd: 1,
  fullhd: 1,
  '1080p': 1,
  1080: 1,
  '4k': 2,
  '2160p': 2,
  2160: 2,
}
