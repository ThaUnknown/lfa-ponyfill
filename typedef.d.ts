// using `a` instead of `..` to reduce file size
// ranges are 1-10 as they are divided by 100, e.g. 4a7 = 400..700 or for italic 4a7i = 400..700 italic
type FontTypes = number|`${number}i`|`${number}a${number}`|`${number}a${number}i`|(string & {})

type Family = string

export type FamilyMetadata = [Family, FontTypes[]]
