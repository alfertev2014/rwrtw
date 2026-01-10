import type { PlaceholderComponent } from "./core/types.js"
import { reProp, type ReactiveValue } from "./template-reactive/index.js"
import {
  el,
  on,
  type PropsOfElement,
  type TagToHTMLElement,
} from "./template/index.js"
import type {
  TemplateContent,
  TemplateElementAttrsConfig,
  TemplateHandler,
} from "./template/types.js"
import type { ScalarData } from "./types.js"

export type UnknownProps = { [key: string]: unknown }

export type ClassConfig = Record<string, boolean | undefined | null> | string | undefined | null | ClassConfig[]

export type ElementProps = {
  children?: TemplateContent
  style?: CSSStyleDeclaration | string
  class?: ClassConfig
  id?: string
  [key: `on:${string}`]: EventListener
  [key: `p:${string}`]: ReactiveValue<ScalarData>
  [key: string]: unknown
}
export type ComponentType<in Props extends UnknownProps> = (
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
  export type ElementType<Props extends UnknownProps = UnknownProps> =
    string | ComponentType<Props>
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
    const attrs: TemplateElementAttrsConfig = {}
    const properties: TemplateHandler<HTMLElement>[] = []
    const events: TemplateHandler<HTMLElement>[] = []
    for (const [prop, value] of Object.entries(props)) {
      if (prop === "children") {
        children = value as TemplateContent
      } else if (prop.startsWith("on:")) {
        events.push(on(prop.slice(3), value as EventListener))
      } else if (prop.startsWith("p:")) {
        properties.push(reProp(prop.slice(2), value as ReactiveValue<ScalarData>))
      } else {
        attrs[prop] = value as ScalarData
      }
    }
    return el(type, attrs, ...properties, ...events)(children)
  }
  if (typeof type === "function") {
    return type(props)
  }
  throw new Error("Unsupported jsx element type")
}

export const jsxs = jsx
