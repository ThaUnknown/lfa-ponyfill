# Local Font Access Ponyfill

Local Font Access API ponyfilled via Google Fonts API. Allows you to use LFA on any environment which supports `fetch`.

```js
import queryLocalFonts from 'lfa-ponyfill'

// use queryLocalFonts with automatic fallback to remote google fonts
const fonts = await queryLocalFonts({ postscriptNames: ['Roboto', 'Roboto-Bold'] })
const blob = await fonts[0].blob()

const all = await queryLocalFonts() // 3.4k fonts, 1.8k font families!

await queryLocalFonts({ postscriptNames: ['Rosario-Bold-Italic'] }) // specific style
await queryLocalFonts({ postscriptNames: ['rosariobolditalic'] }) // this also works
```

Or if you don't want a polyfill and explicitly use remote fonts only:

```js
import { queryRemoteFonts } from 'lfa-ponyfill'

// use remote fonts from google
const fonts = await queryRemoteFonts({ postscriptNames: ['Roboto', 'Roboto-Bold'] })
const blob = await fonts[0].blob()
```

This might not include some very common fonts such as Arial because of licensing!

Most of Google's fonts are under SIL Open Font License.
