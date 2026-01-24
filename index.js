// @ts-expect-error non-standard api
const SUPPORTS = 'queryLocalFonts' in globalThis && globalThis.queryLocalFonts

/** @type {{[weight: number]: string}} */
const WEIGHT_MAP = {
  100: 'Thin',
  200: 'ExtraLight',
  300: 'Light',
  400: 'Regular', // Normal isn't used
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
  800: 'ExtraBold',
  900: 'Black',
  1000: 'UltraBlack'
}

class FontData {
  family
  fullName
  postscriptName
  style

  #weight
  #isItalic

  /** @param {{family: string, weight: string, isItalic: boolean, weightName: string}} param0 */
  constructor ({ family, weight, isItalic, weightName }) {
    this.family = family
    this.#weight = weight
    this.#isItalic = isItalic

    // general name fuckery
    const isRegular = weightName === 'Regular'
    // Regular Italic => Italic
    // Regular => Regular
    // Medium => Medium
    // Medium Italic => Medium Italic
    if (isRegular) {
      if (isItalic) {
        this.style = 'Italic'
      } else {
        this.style = 'Regular'
      }
    } else {
      this.style = weightName + (isItalic ? ' Italic' : '')
    }
    // Arial Regular => Arial
    // Arial Regular Italic => Arial Italic
    // Arial Medium => Arial Medium
    // Arial Medium Italic => Arial Medium Italic
    if (this.style === 'Regular') {
      this.fullName = family
    } else {
      this.fullName = `${family} ${this.style}`
    }
    this.postscriptName = this.fullName.replace(/ /g, '-')
  }

  async blob () {
    const response = await fetch(`https://fonts.googleapis.com/css2?family=${this.family}:${this.#isItalic ? 'ital,' : ''}wght@${this.#isItalic ? '1,' : ''}${this.#weight}`)
    const css = await response.text()
    const matches = [
      /\/\* latin-ext \*\/[\s\S]+url\(([^)]+)\)/, // get first latin woff2 url from css
      /\/\* latin \*\/[\s\S]+url\(([^)]+)\)/, // TODO: what if some1 wants a japanse font but it includes latin? "Noto Sans JP"
      /url\(([^)]+)\)/
    ]
    for (const match of matches) {
      const url = css.match(match)?.[1]
      if (url) {
        const response = await fetch(url)
        if (response.ok) return response.blob()
      }
    }
    throw new Error('Failed to load font blob')
  }
}

/** @param {import('./typedef.d.ts').FamilyMetadata} familyMetadata */
function fromMetadata ([family, sizes]) {
  const fontData = []
  for (const _type of sizes) {
    // google likes to split their fonts into minimal parts, we'll try to get as wide of a range as possible, so if someone requests 'normal', they'll get all weights [if available]
    // 1 or '1i' or '1a10' or '1a10i'
    const type = '' + _type
    const isItalic = type.endsWith('i')
    const weight = type.replace('i', '')
    if (weight.includes('a')) {
      const [min, max] = weight.split('a').map(a => parseInt(a) * 100)
      for (let i = min; i <= max; i += 100) {
        fontData.push(new FontData({ family: family, weight: `${min}..${max}`, isItalic, weightName: WEIGHT_MAP[i] }))
      }
    } else {
      fontData.push(new FontData({ family: family, weight: `${weight}00`, isItalic, weightName: WEIGHT_MAP[parseInt(weight) * 100] }))
    }
  }
  return fontData
}

/** @type {Map<any, FontData>} */
let fontCache = new Map()

async function getFontCache () {
  if (fontCache.size === 0) {
    // import async, as this is absolutely massive and potentially laggy
    // also allows for code splitting
    // storing hardcoded objects is faster as json, https://v8.dev/blog/cost-of-javascript-2019#json
    /** @type {{default: import('./typedef.d.ts').FamilyMetadata[]}} */
    // @ts-expect-error override
    const fonts = await import('./fonts.json', { with: { type: 'json' }})
    for (const font of fonts.default.flatMap(familyMetadata => fromMetadata(familyMetadata))) {
      fontCache.set(font.postscriptName.toLowerCase().replace(/-/g, ''), font)
    }
  }
  return fontCache
}

/**
 * @param {{postscriptNames?: string[]}} param0
 * @returns {Promise<FontData[]>}
 */
export async function queryRemoteFonts ({ postscriptNames } = {}) {
  const fontCache = await getFontCache()

  if (!postscriptNames) return [...fontCache.values()]
  if (postscriptNames.length === 0) return []

  return postscriptNames.reduce((acc, postscriptName) => {
    const font = fontCache.get(postscriptName.toLowerCase().replace(/regular$/, '').replace(/-reg$/, '').replace(/[- ]/g, ''))
    if (font) acc.push(font)
    return acc
  }, /** @type {FontData[]} */([]))
}

/**
 * @param {{postscriptNames?: string[]}} param0
 * @returns {Promise<FontData[]>}
 */
export default async function queryLocalFonts ({ postscriptNames } = {}) {
  if (SUPPORTS) return SUPPORTS({ postscriptNames })
  return queryRemoteFonts({ postscriptNames })
}
