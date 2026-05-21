import type { DeclPrimitiveValue } from "./literalValues.js"
import type { DeclType } from "./typeExpressions.js"

export const UNARY = "unary"
export const BINARY = "binary"
export const TERNARY = "if"
export const LITERAL = "literal"
export const ELLIPSIS = "ellipsis"
export const PROPERTY = "property"
export const INDEXER = "indexer"
export const LAMBDA = "lambda"
export const CALL = "call"
export const OBJECT_TEMPLATE = "obj"
export const ARRAY_TEMPLATE = "arr"
export const VAR_DEFINITION = "var"
export const PROP_DEFINITION = "prop"
export const OBJECT_DESTRUCT = "objDestruct"
export const ARRAY_DESTRUCT = "arrDestruct"
export const DEFINITION = "definition"
export const TYPE_DEFINITION = "typeDefinition"
export const IDENTIFIER = "identifier"
export const AS = "as"
export const IMPORT = "import"
export const EXPORT = "export"
export const MODULE = "module"


export type DeclUnaryOperator = "+" | "-" | "!" | "~" | "typeof"

export type DeclUnaryExpression = {
  readonly tag: typeof UNARY
  readonly name: DeclUnaryOperator
  readonly body: DeclExpression
}
export const unary = (
  name: DeclUnaryOperator,
  body: DeclExpression,
): DeclUnaryExpression => ({
  tag: UNARY,
  name,
  body,
})

export type DeclBinaryOperator =
  | "+"
  | "-"
  | "*"
  | "/"
  | "**"
  | "<<"
  | ">>"
  | ">>>"
  | "."
  | "[]"
  | "&"
  | "|"
  | "&&"
  | "||"
  | "??"
  | "<"
  | ">"
  | "<="
  | ">="
  | "=="
  | "!="
  | "==="
  | "!=="

export type DeclBinaryExpression = {
  readonly tag: typeof BINARY
  readonly left: DeclExpression
  readonly name: DeclBinaryOperator
  readonly right: DeclExpression
}
export const binary = (
  left: DeclExpression,
  name: DeclBinaryOperator,
  right: DeclExpression,
): DeclBinaryExpression => ({
  tag: BINARY,
  left,
  name,
  right,
})

export type DeclTernaryExpression = {
  readonly tag: typeof TERNARY
  readonly condition: DeclExpression
  readonly trueBranch: DeclExpression
  readonly falseBranch: DeclExpression
}
export const ternary = (
  condition: DeclExpression,
  trueBranch: DeclExpression,
  falseBranch: DeclExpression,
): DeclTernaryExpression => ({
  tag: TERNARY,
  condition,
  trueBranch,
  falseBranch,
})

export type DeclLiteral = {
  readonly tag: typeof LITERAL
  readonly value: DeclPrimitiveValue
}
export const literal = (value: DeclPrimitiveValue): DeclLiteral => ({
  tag: LITERAL,
  value,
})

export type DeclEllipsisExpression = {
  readonly tag: typeof ELLIPSIS
  readonly body: DeclExpression
}
export const ellipsis = (body: DeclExpression): DeclEllipsisExpression => ({
  tag: ELLIPSIS,
  body,
})

export type DeclCallExpression = {
  readonly tag: typeof CALL
  readonly func: DeclExpression
  readonly args: readonly (DeclExpression | DeclEllipsisExpression)[]
}
export const call = (
  func: DeclExpression,
  args: readonly (DeclExpression | DeclEllipsisExpression)[],
): DeclCallExpression => ({
  tag: CALL,
  func,
  args,
})

export type DeclArray = {
  readonly tag: typeof ARRAY_TEMPLATE
  readonly items: readonly (DeclExpression | DeclEllipsisExpression)[]
}
export const arr = (
  items: readonly (DeclExpression | DeclEllipsisExpression)[],
): DeclArray => ({
  tag: ARRAY_TEMPLATE,
  items,
})

export type DeclKeyValue = {
  readonly tag: typeof PROPERTY
  readonly key: string | number
  readonly value: DeclExpression
}
export const propValue = (
  key: string | number,
  value: DeclExpression,
): DeclKeyValue => ({
  tag: PROPERTY,
  key,
  value,
})

export type DeclIndexValue = {
  readonly tag: typeof INDEXER
  readonly index: DeclExpression
  readonly value: DeclExpression
}
export const indexValue = (
  index: DeclExpression,
  value: DeclExpression,
): DeclIndexValue => ({
  tag: INDEXER,
  index,
  value,
})

export type DeclObjectItem =
  | DeclKeyValue
  | DeclIndexValue
  | DeclEllipsisExpression

export type DeclObject = {
  readonly tag: typeof OBJECT_TEMPLATE
  readonly items: readonly DeclObjectItem[]
}
export const obj = (items: readonly DeclObjectItem[]): DeclObject => ({
  tag: OBJECT_TEMPLATE,
  items,
})

export type DeclVarDefinition = {
  readonly tag: typeof VAR_DEFINITION
  readonly name: string
  readonly value?: DeclExpression
  readonly optional?: boolean
}
export const defVar = (
  name: string,
  value?: DeclExpression,
): DeclVarDefinition => ({
  tag: VAR_DEFINITION,
  name,
  value,
})

export type DeclPropDestruct =
  | DeclVarDefinition
  | {
      tag: typeof PROP_DEFINITION
      readonly name: string
      readonly pattern: DeclDestruct
    }

export type DeclObjectDestruct = {
  readonly tag: typeof OBJECT_DESTRUCT
  readonly props: readonly DeclPropDestruct[]
  readonly rest?: DeclVarDefinition | DeclObjectDestruct
  readonly value?: DeclExpression
}
export const defObj = (
  props: readonly DeclPropDestruct[],
  rest?: DeclVarDefinition | DeclObjectDestruct,
  value?: DeclExpression,
): DeclObjectDestruct => ({
  tag: OBJECT_DESTRUCT,
  props,
  rest,
  value,
})

export type DeclArrayDestruct = {
  readonly tag: typeof ARRAY_DESTRUCT
  readonly items: readonly DeclDestruct[]
  readonly rest?: DeclVarDefinition | DeclArrayDestruct
  readonly value?: DeclExpression
}
export const defArr = (
  items: readonly DeclDestruct[],
  rest?: DeclVarDefinition | DeclArrayDestruct,
  value?: DeclExpression,
): DeclArrayDestruct => ({
  tag: ARRAY_DESTRUCT,
  items,
  rest,
  value,
})

export type DeclDestruct =
  | DeclVarDefinition
  | DeclObjectDestruct
  | DeclArrayDestruct

export type DeclDeclarator = {
  readonly pattern: DeclDestruct
  readonly type?: DeclType
  readonly description?: string
}
export const decl = (
  pattern: DeclDestruct,
  type?: DeclType,
  description?: string,
): DeclDeclarator => ({
  pattern,
  type,
  description,
})

export type DeclLambdaExpression = {
  readonly tag: typeof LAMBDA
  readonly args: readonly DeclDeclarator[]
  readonly body: DeclExpression
  readonly resultType?: DeclType
  readonly rest?: DeclVarDefinition | DeclArrayDestruct
  readonly restType?: DeclType
  readonly restValue?: DeclExpression
}
export const lambda = (
  args: readonly DeclDeclarator[],
  body: DeclExpression,
  resultType?: DeclType,
  rest?: DeclVarDefinition | DeclArrayDestruct,
  restType?: DeclType,
  restValue?: DeclExpression,
): DeclLambdaExpression => ({
  tag: LAMBDA,
  args,
  body,
  resultType,
  rest,
  restType,
  restValue,
})

export type DeclDefinition = {
  readonly tag: typeof DEFINITION
  readonly def: readonly DeclDeclarator[]
  readonly mutable: boolean
}
export const definition = (
  def: readonly DeclDeclarator[],
  mutable = false,
): DeclDefinition => ({
  tag: DEFINITION,
  def,
  mutable,
})

export type DeclTypeDefinition = {
  readonly tag: typeof TYPE_DEFINITION
  readonly name: string
  readonly type: DeclType
  readonly description?: string
}
export const typeDefinition = (
  name: string,
  type: DeclType,
  description?: string,
): DeclTypeDefinition => ({
  tag: TYPE_DEFINITION,
  name, type, description
})

export type DeclIdentifier = {
  readonly tag: typeof IDENTIFIER
  readonly name: string
}
export const id = (name: string): DeclIdentifier => ({
  tag: IDENTIFIER,
  name,
})

export type DeclTypeAnnotation = {
  readonly tag: typeof AS
  readonly body: DeclExpression
  readonly type: DeclType
}
export const cast = (
  body: DeclExpression,
  type: DeclType,
): DeclTypeAnnotation => ({
  tag: AS,
  body,
  type,
})

export type DeclImportSpecifier = {
  sourceName: string
  alias?: string
  isType?: boolean
}

export type DeclImport = {
  readonly tag: typeof IMPORT
  readonly source: string
  readonly specifiers: readonly DeclImportSpecifier[]
  readonly default?: DeclImportSpecifier
}
export const importDestruct = (
  source: string,
  specifiers: DeclImportSpecifier[],
  defaultName?: string,
): DeclImport => ({
  tag: IMPORT,
  source,
  specifiers,
  default: defaultName ? { sourceName: defaultName } : undefined,
})
export const importDefault = (
  source: string,
  defaultSpec: DeclImportSpecifier,
): DeclImport => ({
  tag: IMPORT,
  source,
  specifiers: [],
  default: defaultSpec,
})

export type DeclExport = {
  readonly tag: typeof EXPORT
  readonly def: DeclDefinition | DeclTypeDefinition
}
export const exportDef = (
  def: DeclDefinition | DeclTypeDefinition,
): DeclExport => ({
  tag: EXPORT,
  def,
})

export type DeclExpression =
  | DeclLiteral
  | DeclIdentifier
  | DeclUnaryExpression
  | DeclBinaryExpression
  | DeclTernaryExpression
  | DeclCallExpression
  | DeclArray
  | DeclObject
  | DeclLambdaExpression
  | DeclTypeAnnotation

export type DeclTopLevel = DeclExpression | DeclDefinition | DeclTypeDefinition | DeclImport | DeclExport

export type DeclModule = {
  readonly tag: typeof MODULE
  readonly topLevel: DeclTopLevel[]
  readonly description?: string
}
export const moduleTopLevel = (topLevel: DeclTopLevel[], description?: string): DeclModule => ({
  tag: MODULE,
  topLevel,
  description,
})
