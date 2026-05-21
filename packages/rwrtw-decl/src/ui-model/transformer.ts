import {
  DEFINITION,
  EXPORT,
  IMPORT,
  LAMBDA,
  TYPE_DEFINITION,
  VAR_DEFINITION,
  type DeclDefinition,
  type DeclImport,
  type DeclModule,
  type DeclTypeDefinition,
} from "../ast/index.js"
import {
  COMPUTED_VALUE,
  PURE_FUNCTION,
  STATE,
  uiDef,
  uiExport,
  uiModule,
  uiTypedef,
  uiValue,
  type DeclUIDefinition,
  type DeclUIExport,
  type DeclUIModule,
} from "./template.js"

const transformDefinition = (
  def: DeclDefinition,
): readonly DeclUIDefinition[] => {
  const uiDefs: DeclUIDefinition[] = []
  if (def.mutable) {
    for (const declarator of def.def) {
      if (declarator.pattern.tag === VAR_DEFINITION) {
        const { name, value } = declarator.pattern
        if (!value) {
          throw new Error("Initializer is required in state definition")
        }
        if (value.tag === LAMBDA) {
          // TODO: Check state type recursively
          throw new Error(
            "Lambda expressions are not supported as state initializers",
          )
        }

        // TODO: Get inferred type if not specified
        uiDefs.push(uiDef(name, uiValue(STATE, value, declarator.type)))
      } else {
        throw new Error(
          "Definition of state with destruction is not supported yet",
        )
      }
    }
  } else {
    for (const declarator of def.def) {
      if (declarator.pattern.tag === VAR_DEFINITION) {
        const { name, value } = declarator.pattern
        if (!value) {
          throw new Error("Const initializer is required")
        }

        // TODO: Get inferred type if not specified
        if (value.tag === LAMBDA) {
          // TODO: Check result type for action
          uiDefs.push(
            uiDef(name, uiValue(PURE_FUNCTION, value, declarator.type)),
          )
        } else {
          uiDefs.push(
            uiDef(name, uiValue(COMPUTED_VALUE, value, declarator.type)),
          )
        }
      } else {
        throw new Error(
          "Definition of computed with destruction is not supported yet",
        )
      }
    }
  }
  return uiDefs
}

const transformTypeDefinition = (def: DeclTypeDefinition): DeclUIDefinition => {
  // TODO: Check type for reactive state type recursively
  return uiDef(def.name, uiTypedef(def.type, def.description))
}

export const astToUi = (module: DeclModule): DeclUIModule => {
  const { topLevel, description } = module
  const imports: DeclImport[] = []
  const definitions: (DeclUIExport | DeclUIDefinition)[] = []
  for (const top of topLevel) {
    switch (top.tag) {
      case IMPORT: {
        imports.push(top)
        break
      }
      case EXPORT: {
        switch (top.def.tag) {
          case DEFINITION: {
            const uiDefs = transformDefinition(top.def)
            for (const uiDef of uiDefs) {
              definitions.push(uiExport(uiDef))
            }
            break
          }
          case TYPE_DEFINITION: {
            definitions.push(uiExport(transformTypeDefinition(top.def)))
            break
          }
        }
        break
      }
      case DEFINITION: {
        const uiDefs = transformDefinition(top)
        for (const uiDef of uiDefs) {
          definitions.push(uiDef)
        }
        break
      }
      case TYPE_DEFINITION: {
        definitions.push(transformTypeDefinition(top))
        break
      }
      default:
        throw new Error(`Unsupported top level syntax ${top.tag}`)
    }
  }
  return uiModule(imports, definitions, description)
}
