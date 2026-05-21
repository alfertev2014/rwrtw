import type { DeclPrimitiveValue } from "./literalValues.js"
import type { PROP_DEFINITION } from "./sourceExpressions.js"
import {
  ARRAY_DESTRUCT,
  type DeclIdentifier,
  OBJECT_DESTRUCT,
  VAR_DEFINITION,
} from "./sourceExpressions.js"

export const STRING = "string"
export const NUMBER = "number"
export const BIGINT = "bigint"
export const BOOLEAN = "boolean"
export const UNKNOWN = "unknown"
export const NEVER = "never"

export type DeclBuiltinTag =
  | typeof STRING
  | typeof NUMBER
  | typeof BIGINT
  | typeof BOOLEAN
  | typeof UNKNOWN
  | typeof NEVER

export const BUILTIN = "builtin"
export const LITERAL_TYPE = "literal"
export const OBJECT = "object"
export const ARRAY = "array"
export const TUPLE = "tuple"
export const FUNCTIONAL = "functional"
export const UNION = "union"
export const INTERSECTION = "intersection"
export const CONDITIONAL = "conditional"
export const GENERIC = "generic"
export const GENERIC_CALL = "genericCall"
export const TYPE_IDENTIFIER = "identifier"

export type DeclTypeCtor =
  | typeof BUILTIN
  | typeof LITERAL_TYPE
  | typeof OBJECT
  | typeof ARRAY
  | typeof FUNCTIONAL
  | typeof UNION
  | typeof INTERSECTION
  | typeof CONDITIONAL
  | typeof GENERIC
  | typeof GENERIC_CALL
  | typeof TYPE_IDENTIFIER

export type DeclBuiltinType = {
  readonly tctor: typeof BUILTIN
  readonly tag: DeclBuiltinTag
}
export const builtinType = (tag: DeclBuiltinTag): DeclBuiltinType => ({
  tctor: BUILTIN,
  tag,
})

export type DeclLiteralType = {
  readonly tctor: typeof LITERAL_TYPE
  readonly value: DeclPrimitiveValue
}
export const literalType = (value: DeclPrimitiveValue): DeclLiteralType => ({
  tctor: LITERAL_TYPE,
  value,
})

export type DeclPropDefinition = {
  readonly name: string | number
  readonly description?: string
  readonly type: DeclType
  readonly optional: boolean
  readonly readonly: boolean
}

export type DeclIndexerDefinition = {
  readonly description?: string
  readonly indexType: DeclType
  readonly type: DeclType
  readonly optional: boolean
  readonly readonly: boolean
}

export type DeclObjectType = {
  readonly tctor: typeof OBJECT
  readonly props: readonly DeclPropDefinition[]
  readonly indexer?: DeclIndexerDefinition
}
export const objectType = (
  props: readonly DeclPropDefinition[],
  indexer?: DeclIndexerDefinition,
): DeclObjectType => ({
  tctor: OBJECT,
  props,
  indexer,
})

export type DeclArrayType = {
  readonly tctor: typeof ARRAY
  readonly items: DeclType
}
export const arrayType = (items: DeclType): DeclArrayType => ({
  tctor: ARRAY,
  items,
})

export type DeclTupleType = {
  readonly tctor: typeof TUPLE
  readonly items: readonly DeclType[]
  readonly rest?: DeclType
}
export const tupleType = (
  items: readonly DeclType[],
  rest?: DeclType,
): DeclTupleType => ({
  tctor: TUPLE,
  items,
  rest,
})

export type DeclArgVarDefinition = {
  readonly tag: typeof VAR_DEFINITION
  readonly name: string
}
export const argVar = (name: string): DeclArgVarDefinition => ({
  tag: VAR_DEFINITION,
  name,
})

export type DeclArgPropDestruct =
  | DeclArgVarDefinition
  | {
      tag: typeof PROP_DEFINITION
      name: string
      pattern: DeclArgDestruct
    }

export type DeclArgObjectDestruct = {
  readonly tag: typeof OBJECT_DESTRUCT
  readonly props: readonly DeclArgPropDestruct[]
  readonly rest?: DeclArgDestruct
}
export const argObj = (
  props: readonly DeclArgPropDestruct[],
  rest?: DeclArgDestruct,
): DeclArgObjectDestruct => ({
  tag: OBJECT_DESTRUCT,
  props,
  rest,
})

export type DeclArgArrayDestruct = {
  readonly tag: typeof ARRAY_DESTRUCT
  readonly items: readonly DeclArgDestruct[]
  readonly rest?: DeclArgDestruct
}
export const argArr = (
  items: readonly DeclArgDestruct[],
  rest?: DeclArgDestruct,
): DeclArgArrayDestruct => ({
  tag: ARRAY_DESTRUCT,
  items,
  rest,
})

export type DeclArgDestruct =
  | DeclArgVarDefinition
  | DeclArgObjectDestruct
  | DeclArgArrayDestruct

export type DeclArgDefinition = {
  readonly pattern: DeclArgDestruct
  readonly description?: string
  readonly type: DeclType
  readonly optional: boolean
}

export type DeclFunctionalType = {
  readonly tctor: typeof FUNCTIONAL
  readonly result: DeclType
  readonly args: readonly DeclArgDefinition[]
  readonly rest?: DeclArgDefinition
  readonly description?: string
}
export const funcType = (
  result: DeclType,
  args: readonly DeclArgDefinition[],
  rest?: DeclArgDefinition,
  description?: string,
): DeclFunctionalType => ({
  tctor: FUNCTIONAL,
  result,
  args,
  rest,
  description
})

export type DeclUnionType = {
  readonly tctor: typeof UNION
  readonly args: readonly DeclType[]
}
export const unionType = (args: readonly DeclType[]): DeclUnionType => ({
  tctor: UNION,
  args,
})

export type DeclIntersectionType = {
  readonly tctor: typeof INTERSECTION
  readonly args: readonly DeclType[]
}
export const intersectionType = (
  args: readonly DeclType[],
): DeclIntersectionType => ({
  tctor: INTERSECTION,
  args,
})

export type DeclTypeVarDefinition = {
  readonly name: string
  readonly upperBound?: DeclType
  readonly default?: DeclType
}

export type DeclGenericType = {
  readonly tctor: typeof GENERIC
  readonly targs: readonly DeclTypeVarDefinition[]
  readonly body: DeclType
}
export const genericType = (
  targs: readonly DeclTypeVarDefinition[],
  body: DeclType,
): DeclGenericType => ({
  tctor: GENERIC,
  targs,
  body,
})

export type DeclGenericCallType = {
  readonly tctor: typeof GENERIC_CALL
  readonly name: string
  readonly args: readonly DeclType[]
}
export const genericCallType = (
  name: string,
  args: readonly DeclType[],
): DeclGenericCallType => ({
  tctor: GENERIC_CALL,
  name,
  args,
})

export type DeclTypeIdentifier = {
  readonly tctor: typeof TYPE_IDENTIFIER
  readonly name: string
}
export const typeIdentifier = (name: string): DeclTypeIdentifier => ({
  tctor: TYPE_IDENTIFIER,
  name,
})

export type DeclType =
  | DeclBuiltinType
  | DeclLiteralType
  | DeclObjectType
  | DeclArrayType
  | DeclTupleType
  | DeclFunctionalType
  | DeclUnionType
  | DeclIntersectionType
  | DeclGenericType
  | DeclTypeIdentifier
