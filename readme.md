# Local Font Access Ponyfill

Local Font Access API ponyfilled via Google Fonts API. Allows you to use LFA on any environment which supports `fetch`.

```js
import queryLocalFonts from 'lfa-ponyfill'

const fonts = await queryLocalFonts({ postscriptNames: ['Roboto', 'Roboto-Bold'] })
const blob = await fonts[0].blob()

const all = await queryLocalFonts() // 6.1k fonts, 1.6k font families!

await queryLocalFonts({ postscriptNames: ['Rosario-Bold-Italic'] }) // specific style
await queryLocalFonts({ postscriptNames: ['rosariobolditalic'] }) // this also works
```

This might not include some very common fonts such as Arial because of licensing!

Most of Google's fonts are under SIL Open Font License.