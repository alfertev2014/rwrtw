export type DeclPrimitiveValue =
  | string
  | number
  | boolean
  | bigint
  | null
  | undefined

export type DeclAnyValue = DeclPrimitiveValue | object

export type DeclStructValue = {
  readonly [key: string | number]: DeclAnyValue
}

export type DeclValue =
  | DeclPrimitiveValue
  | readonly DeclAnyValue[]
  | DeclStructValue
