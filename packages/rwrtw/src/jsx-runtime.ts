
import type { PlaceholderComponent } from "./core/types.js";
import { el } from "./template/index.js"
import type { TemplateContent, TemplateElementAttrsConfig } from "./template/types.js"

export type UnknownProps = { [key: string]: unknown }
export type ChildrenProps = { children?: TemplateContent }
export type ComponentType<Props extends UnknownProps = UnknownProps> = (props: Props) => PlaceholderComponent

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace JSX {
  export interface IntrinsicElements {
    [tagName: string]: TemplateElementAttrsConfig & ChildrenProps
  }

  export interface ElementAttributesProperty {
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      props: {};
  }
  export interface ElementChildrenAttribute {
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      children: {};
  }

  export type Element = PlaceholderComponent
  export type ElementType = string | ComponentType
}

export const jsx: {
  (
    type: string,
    props: TemplateElementAttrsConfig & ChildrenProps,
  ): PlaceholderComponent
  <Props extends UnknownProps>(
    type: ComponentType<Props>,
    props: Props,
  ): PlaceholderComponent | null
  (
    type: string |ComponentType,
    props: UnknownProps,
  ): PlaceholderComponent | null
} = (
  type: string | ComponentType,
  props: UnknownProps,
): PlaceholderComponent => {
  if (typeof type === "string") {
    const { children, ...attrs } = props as unknown as TemplateElementAttrsConfig & ChildrenProps
    return el(type, attrs)(children)
  }
  if (typeof type === "function") {
    return type(props)
  }
  throw new Error("Unsupported jsx element type")
}

export const jsxs = jsx
