import { queryRemoteFonts } from './index.js'

const fonts = await queryRemoteFonts()

/**
 * @type {string[]}
 */
const errors = []
// batch 20 fonts at a time
for (let i = 0; i < fonts.length; i += 20) {
  const batch = fonts.slice(i, i + 20)
  // load all blobs in parallel
  const promises = batch.map(async font => {
    try {
      await font.blob()
    } catch (e) {
      errors.push(font.postscriptName)
      console.error(`Failed to load font blob for ${font.postscriptName}:`, e)
    }
  })
  await Promise.all(promises)
}

console.log('All font blobs loaded')
console.log(`Failed fonts: ${errors.length}`, errors)