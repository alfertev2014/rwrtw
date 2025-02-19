export type ScalarData = number | string | boolean | bigint | null | undefined

export type RecordData = {
  readonly [key: string | number]: PlainData
}

export type PlainData = ScalarData | RecordData | readonly PlainData[]
