type FontTypes = number|`${number}i`|`${number}..${number}`|`${number}..${number}i`

export type FamilyMetadata = {
  'family': string,
  'fonts': FontTypes[]
}[]

export type f = FamilyMetadata
