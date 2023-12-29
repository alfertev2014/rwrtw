import { type ElementAttrValue } from "../dom/helpers.js"
import { EventHandlerController, type EventHandlersMap } from "../events.js"
import { type PlaceholderList, type Lifecycle, type Placeholder } from "../core/index.js"

export type RenderedType = "element" | "text" | "placeholder" | "list" | "component" | "lifecycle"

export interface RenderedElement {
  type: "element"
  tag: string
  attrs: TemplateElementAttrsMap | null
  handlers: ElementHandler[]
  children: RenderedContent
}

export interface RenderedText {
  type: "text"
  data: string
  handler?: (node: Text) => Lifecycle | undefined
}

export interface RenderedPlaceholder {
  type: "placeholder"
  content: RenderedContent
  handler?: (placeholder: Placeholder) => void
}

export interface RenderedList {
  type: "list"
  contents: RenderedContent[]
  handler?: (list: PlaceholderList) => void
}

export interface RenderedComponent {
  type: "component"
  factory: (...args: unknown[]) => RenderedContent
  args: unknown[]
}

export interface RenderedLifecycle extends Lifecycle {
  type: "lifecycle"
}

export type Rendered =
  | RenderedElement
  | RenderedText
  | RenderedPlaceholder
  | RenderedList
  | RenderedComponent
  | RenderedLifecycle
  | string
  | number
  | boolean
  | null
  | undefined

export type RenderedContent = Rendered | RenderedContent[]

export type ElementHandler = (element: HTMLElement) => Lifecycle | undefined
export type AttributeHandler = (element: HTMLElement, attr: string) => Lifecycle | undefined

export type TemplateElementAttrsMap = Record<string, ElementAttrValue | AttributeHandler>

export const on =
  (handlers: EventHandlersMap): ElementHandler =>
  (element) =>
    new EventHandlerController(element, handlers)

export const el =
  (tag: string, attrs: TemplateElementAttrsMap | null = null, ...handlers: ElementHandler[]) =>
  (...children: RenderedContent[]): RenderedElement => ({
    type: "element",
    tag,
    attrs,
    handlers,
    children,
  })

export const text = (data: string, handler?: (node: Text) => Lifecycle | undefined): RenderedText => ({
  type: "text",
  data,
  handler,
})

export const plh = (content: RenderedContent, handler?: (placeholder: Placeholder) => void): RenderedPlaceholder => ({
  type: "placeholder",
  content,
  handler,
})

export const list = (contents: RenderedContent[], handler?: (list: PlaceholderList) => void): RenderedList => ({
  type: "list",
  contents,
  handler,
})

export const cmpnt =
  <Func extends (...args: any[]) => RenderedContent>(factory: Func) =>
  (...args: Parameters<Func>): RenderedComponent => ({
    type: "component",
    factory,
    args,
  })
