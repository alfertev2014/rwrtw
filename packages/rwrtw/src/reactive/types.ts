export type ScalarData = number | string | boolean | bigint | null | undefined

export type RecordData = {
  [key: string | number]: PlainData
}

export type PlainData = ScalarData | RecordData | PlainData[]
