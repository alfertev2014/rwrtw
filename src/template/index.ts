import { dce, setAttr, type ScalarValue, txt } from "../dom/helpers.js"
import { EventHandlerController, type EventHandlersMap } from "../events.js"
import {
  type PlaceholderList,
  type Placeholder,
  type PlaceholderContent,
  type PlaceholderContext,
  type Place,
  placeAtBeginningOf,
  type PlaceholderComponent,
  createChildPlaceholderAt,
  createListAt,
  insertNodeAt,
} from "../core/index.js"

export type TemplateItemType = "element" | "placeholder" | "list" | "component"

export interface ElementTemplateItem {
  type: "element"
  tag: string
  attrs: TemplateElementAttrsMap | null
  children: TemplateItem[]
  handler?: (element: HTMLElement) => void
}

export const el =
  (tag: string, attrs: TemplateElementAttrsMap | null = null, handler?: ElementHandler) =>
  (...children: TemplateItem[]): ElementTemplateItem => ({
    type: "element",
    tag,
    attrs,
    handler,
    children,
  })

export interface PlaceholderTemplateItem {
  type: "placeholder"
  content: PlaceholderContent
  handler?: (placeholder: Placeholder) => void
}

export const plh = (
  content: PlaceholderContent,
  handler?: (placeholder: Placeholder) => void,
): PlaceholderTemplateItem => ({
  type: "placeholder",
  content,
  handler,
})

export interface ListTemplateItem {
  type: "list"
  contents: PlaceholderContent[]
  handler?: (list: PlaceholderList) => void
}

export const list = (contents: PlaceholderContent[], handler?: (list: PlaceholderList) => void): ListTemplateItem => ({
  type: "list",
  contents,
  handler,
})

export interface ComponentTemplateItem {
  type: "component"
  content: PlaceholderContent
}

export const cmpnt = (content: PlaceholderContent): ComponentTemplateItem => ({
  type: "component",
  content,
})

export type TemplateItem =
  | ScalarValue
  | PlaceholderTemplateItem
  | ListTemplateItem
  | ComponentTemplateItem
  | ElementTemplateItem

export type ElementHandler = (element: HTMLElement) => void
export type AttributeHandler = (attr: string, element: HTMLElement, context: PlaceholderContext) => void

export type TemplateElementAttrsMap = Record<string, ScalarValue | AttributeHandler>

export const on =
  (context: PlaceholderContext, handlers: EventHandlersMap): ElementHandler =>
  (element) => {
    const res = new EventHandlerController(element, handlers)
    context.registerLifecycle(res)
    return res
  }

const renderTemplateItems = (place: Place, context: PlaceholderContext, content: TemplateItem[]): Place => {
  for (const rendered of content) {
    if (typeof rendered === "boolean" || rendered == null) {
      return place
    }
    if (typeof rendered === "string") {
      place = insertNodeAt(place, txt(rendered))
    } else if (typeof rendered === "number") {
      place = insertNodeAt(place, txt(rendered.toString()))
    } else if (rendered.type === "element") {
      place = renderElementItem(rendered, place, context)
    } else if (rendered.type === "placeholder") {
      const plh = createChildPlaceholderAt(place, context, rendered.content)
      rendered.handler?.(plh)
      place = plh
    } else if (rendered.type === "list") {
      const list = createListAt(place, context, rendered.contents)
      rendered.handler?.(list)
      place = list
    } else if (rendered.type === "component" && rendered.content != null) {
      place = rendered.content(place, context)
    }
  }
  return place
}

const renderElementItem = (
  { tag, attrs, handler, children }: ElementTemplateItem,
  place: Place,
  context: PlaceholderContext,
): HTMLElement => {
  const element = dce(tag)

  renderTemplateItems(placeAtBeginningOf(element), context, children)

  if (attrs != null) {
    for (const [name, value] of Object.entries(attrs)) {
      if (typeof value === "function") {
        value(name, element, context)
      } else {
        setAttr(element, name, value)
      }
    }
  }

  insertNodeAt(place, element)

  handler?.(element)
  return element
}

export const renderTemplate =
  (...content: TemplateItem[]): PlaceholderComponent =>
  (place, context) => {
    return renderTemplateItems(place, context, content)
  }

export interface TemplateRef<T> {
  current: T
  bind: () => (value: T) => void
}

export const ref = <T>(initValue: T): TemplateRef<T> => ({
  current: initValue,
  bind() {
    return (value: T) => {
      this.current = value
    }
  },
})
