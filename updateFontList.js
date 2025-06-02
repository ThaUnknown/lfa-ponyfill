import { writeFile } from 'fs/promises'

const res = await fetch('https://fonts.google.com/metadata/fonts')

// make it as small as possible
const text = /** @type {{familyMetadataList:any[]}} */(await res.json()).familyMetadataList.map(({ family, fonts, axes }) => {
  // we want to load as wide range of fonts as possible, say some1 requests normal, they'll get all weights since that's most likely what's expected for font rasterization
  const supportsVariable = axes.find(({ tag }) => tag === 'wght')
  if (supportsVariable) {
    const varfonts = []
    const supportsItalic = Object.keys(fonts).some(f => f.endsWith('i'))
    const { min, max } = supportsVariable
    varfonts.push(`${min}..${max}`)
    if (supportsItalic) varfonts.push(`${min}..${max}i`)
    return { fonts: varfonts, family }
  }
  return { fonts: Object.keys(fonts).map(font => Number(font) || font), family }
})

console.log(text.flatMap(f=>f.fonts).length, text.length)

const prefix = `/*eslint-disable*//**@type {import('./typedef.d.ts').f}*/
export default`

await writeFile('fonts.js', prefix + JSON.stringify(text))
