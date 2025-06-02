const SUPPORTS = 'queryLocalFonts' in globalThis && globalThis.queryLocalFonts

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
    // get first latin woff2 url from css
    const latinURL = css.match(/\/\* latin \*\/[\s\S]+url\(([^)]+)\)/)?.[1]
    if (latinURL) {
      const response = await fetch(latinURL)
      return response.blob()
    }
    // this is fallback for all weird fonts like asian ones
    // TODO: what if some1 wants a japanse font but it includes latin? "Noto Sans JP"
    const anyURL = css.match(/url\(([^)]+)\)/)?.[1]
    if (anyURL) {
      const response = await fetch(anyURL)
      return response.blob()
    }
    throw new Error('Failed to load font blob')
  }
}

/** @param {import('./typedef.d.ts').FamilyMetadata[0]} familyMetadata */
function fromMetadata ({ fonts, family }) {
  const fontData = []
  for (const _type of fonts) {
    // google likes to split their fonts into minimal parts, we'll try to get as wide of a range as possible, so if someone requests 'normal', they'll get all weights [if available]
    // 1 or 104 or '104i' or '104..940' or '104..940i'
    const type = '' + _type
    const isItalic = type.endsWith('i')
    const weight = type.replace('i', '')
    if (weight === '1') continue
    if (weight.includes('..')) {
      const [min, max] = weight.split('..').map(Number)
      for (let i = min; i <= max; i += 100) {
        fontData.push(new FontData({ family, weight, isItalic, weightName: WEIGHT_MAP[(i / 100 | 0) * 100] }))
      }
    } else {
      fontData.push(new FontData({ family, weight, isItalic, weightName: WEIGHT_MAP[(Number(weight) / 100 | 0) * 100] }))
    }
  }
  return fontData
}

/** @type {{map: Map<any, FontData>, all: FontData[]} | null} */
let fontCache = null

async function getFontCache () {
  if (fontCache === null) {
    // import async, as this is absolutely massive and potentially laggy
    // also allows for code splitting
    const fonts = await import('./fonts.js')
    const all = fonts.default.flatMap(familyMetadata => fromMetadata(familyMetadata))
    const map = new Map()
    fontCache = { map, all }
    for (const font of all) {
      map.set(font.postscriptName.toLowerCase().replace(/-/g, ''), font)
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

  if (!postscriptNames) return fontCache.all
  if (postscriptNames.length === 0) return []

  return postscriptNames.reduce((acc, postscriptName) => {
    const font = fontCache.map.get(postscriptName.toLowerCase().replace(/regular$/, '').replace(/-reg$/, '').replace(/[- ]/g, ''))
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
