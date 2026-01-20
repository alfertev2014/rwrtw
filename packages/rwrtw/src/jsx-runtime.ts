import {
  reAttr,
  reProp,
  type ReactiveValue,
} from "./template-reactive/index.js"
import {
  el,
  on,
  type PropsOfElement,
  type TagToHTMLElement,
} from "./template/index.js"
import type { TemplateContent, TemplateHandler } from "./template/types.js"
import type { ScalarData } from "./types.js"

export type UnknownProps = { [key: string]: unknown }

export type ClassConfig =
  | Record<string, boolean | undefined | null>
  | string
  | undefined
  | null
  | ClassConfig[]

export type ElementProps = {
  children?: TemplateContent
  style?: ReactiveValue<string> // TODO: reactive style object
  class?: ReactiveValue<string> // TODO: reactive class prop
  id?: string
  [key: `on:${string}`]: EventListener
  [key: `p:${string}`]: ReactiveValue<ScalarData>
  [key: string]: unknown
}
export type ComponentType<Props extends UnknownProps> = (
  props: Props,
) => TemplateContent

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace JSX {
  export interface IntrinsicElements {
    [tagName: string]: ElementProps
  }

  export interface ElementAttributesProperty {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    props: {}
  }
  export interface ElementChildrenAttribute {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    children: {}
  }

  export type Element = TemplateContent
}

export const jsx: {
  <T extends string>(
    type: T,
    props: PropsOfElement<TagToHTMLElement<T>>,
  ): TemplateContent
  <Props extends UnknownProps>(
    type: ComponentType<Props>,
    props: Props,
  ): TemplateContent
  (
    type: string | ComponentType<UnknownProps>,
    props: UnknownProps,
  ): TemplateContent
} = (
  type: string | ComponentType<UnknownProps>,
  props: UnknownProps,
): TemplateContent => {
  if (typeof type === "string") {
    let children: TemplateContent = undefined
    const handlers: TemplateHandler<HTMLElement>[] = []
    for (const [prop, value] of Object.entries(props)) {
      if (prop === "children") {
        children = value as TemplateContent
      } else if (prop.startsWith("on:")) {
        handlers.push(on(prop.slice(3), value as EventListener))
      } else if (prop.startsWith("p:")) {
        handlers.push(reProp(prop.slice(2), value as ReactiveValue<ScalarData>))
      } else {
        handlers.push(reAttr(prop, value as ReactiveValue<ScalarData>))
      }
    }
    return el(type, null, ...handlers)(children)
  }
  if (typeof type === "function") {
    return type(props)
  }
  throw new Error("Unsupported jsx element type")
}

export const jsxs = jsx

export const Fragment = ({ children }: { children: TemplateContent }) =>
  children
