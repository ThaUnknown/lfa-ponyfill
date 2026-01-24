import { writeFile } from 'fs/promises'

import getMetadata from './metadata.js'

const text = await getMetadata()

console.log(text.flatMap(([fam, sizes]) => sizes).length, text.length)

console.log(text)

await writeFile('fonts.json', JSON.stringify(text))
