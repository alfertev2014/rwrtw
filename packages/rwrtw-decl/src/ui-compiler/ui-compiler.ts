import type {
  DeclDefinition,
  DeclLambdaExpression,
  DeclTypeDefinition,
} from "../ast/index.js"
import {
  definition,
  defVar,
  exportDef,
  importDefault,
  importDestruct,
  lambda,
  LAMBDA,
  moduleTopLevel,
  typeDefinition,
  type DeclExpression,
  type DeclModule,
  type DeclTopLevel,
  type DeclType,
} from "../ast/index.js"

import {
  COMPONENT,
  COMPONENT_ELEMENT,
  COMPUTED_VALUE,
  NATIVE_ELEMENT,
  PURE_FUNCTION,
  STATE,
  UI_DEFINITION,
  UI_EXPORT,
  UI_SCOPE,
  UI_TYPEDEF,
  UI_VALUE,
  type DeclUIComponent,
  type DeclUIDefinition,
  type DeclUIModule,
} from "../ui-model/template.js"

const unreachable = (): never => {
  throw new Error("BUG: Unreachable code")
}

type DagNode = {
  deps: DagNode[]
  subs: DagNode[]
  kind: "state" | "computed" | "pure" | "action"
  expression: DeclExpression
}

type DagScope = {
  parent: DagScope | null
  entries: Record<string, DagNode>
}
const lookup = (scope: DagScope, name: string): DagNode | null | undefined =>
  scope.entries[name] ?? (scope.parent ? lookup(scope.parent, name) : null)

type TypeScope = {
  parent: TypeScope | null
  entries: Record<string, DeclType>
}
const typeLookup = (
  scope: TypeScope,
  name: string,
): DeclType | null | undefined =>
  scope.entries[name] ?? (scope.parent ? typeLookup(scope.parent, name) : null)

const transformComponent = (
  parentScope: DagScope,
  parentTypeScope: TypeScope,
  { body, args: { props, actions, slots } }: DeclUIComponent,
): DeclExpression => {
  const dagScope: DagScope = { parent: parentScope, entries: {} }
  const typeScope: TypeScope = { parent: parentTypeScope, entries: {} }

  const transformReactiveType = (reactiveType: DeclType): void => {}

  const transformState = (
    stateExpression: DeclExpression,
    type: DeclType | undefined,
  ): void => {}

  const transformComputed = (
    computedExpression: DeclExpression,
    type: DeclType | undefined,
  ): void => {}

  const transformPureFunction = (
    pureExpression: DeclLambdaExpression,
    type: DeclType | undefined,
  ): void => {}

  const transformDefinition = (def: DeclUIDefinition): void => {
    const { name, value } = def
    switch (value.uiTag) {
      case UI_TYPEDEF: {
        transformReactiveType(value.type)
        break
      }
      case UI_VALUE: {
        switch (value.kind) {
          case STATE: {
            transformState(value.expression, value.type)
            break
          }
          case COMPUTED_VALUE: {
            transformComputed(value.expression, value.type)
            break
          }
          case PURE_FUNCTION: {
            if (value.expression.tag === LAMBDA) {
              transformPureFunction(value.expression, value.type)
              break
            } else {
              return unreachable()
            }
          }
          default:
            return unreachable()
        }
        break
      }
      case COMPONENT: {
        transformComponent(dagScope, typeScope, value)
      }
      default:
        return unreachable()
    }
  }

  const template: DeclExpression

  if (Array.isArray(body)) {
  } else if ("uiTag" in body) {
    switch (body.uiTag) {
      case UI_SCOPE:
        body.body
        break
      case COMPONENT_ELEMENT:
        break
      case NATIVE_ELEMENT:
        break
      default:
        return unreachable()
    }
  } else {
    return unreachable()
  }

  return lambda(args)
}

type DagModule = {
  scope: DagScope
  exports: string[]
}

export const transformModule = (uiModule: DeclUIModule): DagModule => {
  const { imports, definitions } = uiModule
  const scope: DagScope = {}
  const exports: string[] = []

  for (const def of definitions) {
    switch (def.uiTag) {
      case UI_EXPORT: {
        scope[def.def.name] = transformDefinition(scope, def.def)
        exports.push(def.def.name)
        break
      }
      case UI_DEFINITION: {
        scope[def.name] = transformDefinition(scope, def)
        break
      }
    }
  }
  return {
    scope,
    exports,
  }
}
