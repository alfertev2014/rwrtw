import type {
  DeclArgDefinition,
  DeclEllipsisExpression,
  DeclPropDefinition,
  DeclType,
  DeclImport,
  DeclLambdaExpression,
  DeclExpression,
} from "../ast/index.js"

export const COMPONENT = "component"
export const NATIVE_ELEMENT = "nativeElement"
export const COMPONENT_ELEMENT = "componentElement"
export const CURRENT_STATE = "current"
export const UI_LIFECYCLE = "lifecycle"
export const NATIVE_EFFECT = "nativeEffect"
export const REACTIVE_EFFECT = "reactiveEffect"
export const UI_SCOPE = "uiScope"
export const UI_TYPEDEF = "uiTypeDef"
export const UI_VALUE = "uiValue"
export const STATE = "state"
export const PURE_FUNCTION = "pureFunction"
export const COMPUTED_VALUE = "computedValue"
export const ACTION = "action"
export const UI_EXPORT = "uiExport"
export const UI_DEFINITION = "uiDefinition"
export const UI_MODULE = "uiModule"

export type NativeEffect = {
  readonly uiTag: typeof NATIVE_EFFECT
  readonly name: string
  readonly args: readonly (DeclExpression | DeclEllipsisExpression)[]
  readonly description?: string
}

export type DeclUITemplateNativeElement = {
  readonly uiTag: typeof NATIVE_ELEMENT
  readonly name: string
  readonly attrs: Record<string, DeclExpression>
  readonly props: Record<string, DeclExpression>
  readonly effects: NativeEffect[]
  readonly children?: DeclUITemplate
  readonly description?: string
}
export const uiNativeElement = (
  name: string,
  attrs: Record<string, DeclExpression>,
  props: Record<string, DeclExpression>,
  effects: NativeEffect[],
  children?: DeclUITemplate,
  description?: string,
): DeclUITemplateNativeElement => ({
  uiTag: NATIVE_ELEMENT,
  name,
  attrs,
  props,
  effects,
  children,
  description,
})

export type DeclUIComponentPropExpression =
  | DeclExpression
  | DeclUITemplateComponentElement

export type DeclUITemplateComponentElement = {
  readonly uiTag: typeof COMPONENT_ELEMENT
  readonly component: string
  readonly props: Record<string, DeclUIComponentPropExpression>
  readonly children: DeclUITemplate
  readonly description?: string
}
export const uiComponentElement = (
  component: string,
  props: Record<string, DeclUIComponentPropExpression>,
  children: DeclUITemplate,
  description?: string,
): DeclUITemplateComponentElement => ({
  uiTag: COMPONENT_ELEMENT,
  component,
  props,
  children,
  description,
})

export type DeclUITemplateElement =
  | DeclUITemplateNativeElement
  | DeclUITemplateComponentElement

export type DeclUILifecycle = {
  readonly uiTag: typeof UI_LIFECYCLE
  readonly mount: DeclLambdaExpression
  readonly unmount: DeclLambdaExpression
  readonly description?: string
}

export type DeclUITypeDefinition = {
  readonly uiTag: typeof UI_TYPEDEF
  readonly type: DeclType
  readonly description?: string
}
export const uiTypedef = (
  type: DeclType,
  description?: string,
): DeclUITypeDefinition => ({
  uiTag: UI_TYPEDEF,
  type,
  description,
})

export type DeclUIValue = {
  readonly uiTag: typeof UI_VALUE
  readonly kind: typeof PURE_FUNCTION | typeof ACTION | typeof COMPUTED_VALUE | typeof STATE
  readonly expression: DeclExpression
  readonly type?: DeclType
  readonly description?: string
}
export const uiValue = (
  kind: typeof PURE_FUNCTION | typeof ACTION | typeof COMPUTED_VALUE | typeof STATE,
  expression: DeclExpression,
  type?: DeclType,
  description?: string,
): DeclUIValue => ({
  uiTag: UI_VALUE,
  kind,
  expression,
  type,
  description,
})

export type DeclUIDefinition = {
  uiTag: typeof UI_DEFINITION
  readonly name: string
  readonly value:
    | DeclUIValue
    | DeclUITypeDefinition
    | DeclUIComponent
}
export const uiDef = (
  name: string,
  value: DeclUIValue | DeclUITypeDefinition | DeclUIComponent,
): DeclUIDefinition => ({
  uiTag: UI_DEFINITION,
  name,
  value,
})

export type DeclUIScope = {
  readonly uiTag: typeof UI_SCOPE
  readonly defs: readonly DeclUIDefinition[]
  readonly lifecycles?: readonly DeclUILifecycle[]
  readonly body: DeclUITemplate
}
export const uiScope = (
  defs: readonly DeclUIDefinition[],
  body: DeclUITemplate,
  lifecycles?: readonly DeclUILifecycle[],
): DeclUIScope => ({
  uiTag: UI_SCOPE,
  defs,
  body,
  lifecycles,
})

export type DeclUITemplate =
  | DeclUITemplateElement
  | DeclUIScope
  | readonly DeclUITemplate[]

export type DeclActionDefinition = {
  readonly name: string
  readonly args: readonly DeclArgDefinition[]
  readonly description?: string
}

export type DeclSlotDefinition = {
  readonly name: string
  readonly component: DeclUIComponentArgs
  readonly description?: string
}

export type DeclUIComponentArgs = {
  readonly props: readonly DeclPropDefinition[]
  readonly actions: readonly DeclActionDefinition[]
  readonly slots: readonly DeclSlotDefinition[]
}


export type DeclUIComponent = {
  readonly uiTag: typeof COMPONENT
  readonly args: DeclUIComponentArgs
  readonly body: DeclUITemplate
  readonly description?: string
}
export const uiComponent = (
   args: DeclUIComponentArgs,
   body: DeclUITemplate,
   description?: string,
): DeclUIComponent => ({
  uiTag: COMPONENT,
  args,
  body,
  description
})

export type DeclUIExport = {
  readonly uiTag: typeof UI_EXPORT
  readonly def: DeclUIDefinition
}
export const uiExport = (def: DeclUIDefinition): DeclUIExport => ({
  uiTag: UI_EXPORT,
  def,
})

export type DeclUIModule = {
  readonly uiTag: typeof UI_MODULE
  readonly imports: readonly DeclImport[]
  readonly definitions: readonly (DeclUIExport | DeclUIDefinition)[]
  readonly description?: string
}
export const uiModule = (
  imports: readonly DeclImport[],
  definitions: readonly (DeclUIExport | DeclUIDefinition)[],
  description?: string,
): DeclUIModule => ({
  uiTag: UI_MODULE,
  imports,
  definitions,
  description,
})
