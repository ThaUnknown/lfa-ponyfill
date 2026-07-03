import { writeFile } from 'fs/promises'

try {
  const res = await fetch('https://fonts.google.com/metadata/fonts')

  const text =  /** @type {{familyMetadataList:any[]}} */(await res.json()).familyMetadataList.map(({ family, fonts, axes }) => {
    // we want to load as wide range of fonts as possible, say some1 requests normal, they'll get all weights since that's most likely what's expected for font rasterization
    const supportsVariable = axes.find(({ tag }) => tag === 'wght')
    if (supportsVariable) {
      const varfonts = []
      const supportsItalic = Object.keys(fonts).some(f => f.endsWith('i'))
      const { min, max } = supportsVariable
      // using `a` instead of `..` to reduce file size
      const sizeRange = `${Math.ceil(min / 100)}a${max / 100 | 0}`
      varfonts.push(sizeRange)
      // const restMax = max % 100
      // const restMin = min % 100
      // if (restMin !== 0) {
      //   console.debug(`Variable font ${family} has non-100 weight steps: min rest ${restMin}, discarding`)
      // }
      // if (restMax !== 0) {
      //   console.debug(`Variable font ${family} has non-100 weight steps: max rest ${restMax}, discarding`)
      // }

      if (supportsItalic) varfonts.push(sizeRange + 'i')
      return [family, varfonts] 
    }

    return [family, Object.keys(fonts).map(font => {
      const italic = font.endsWith('i')
      const weight = Number(italic ? font.slice(0, -1) : font) / 100 | 0
      return italic ? `${weight}i` : weight
    })]
  })
  // console.log(text.flatMap(([fam, sizes]) => sizes).length, text.length)
  // console.log(text)

  await writeFile('fonts.json', JSON.stringify(text))
} catch (err) {
  console.error('[lfa-ponyfill] Failed to update font list:', err.message)
}
