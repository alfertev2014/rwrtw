import { dce, setAttr, type ScalarValue, txt } from "../dom/helpers.js"
import { EventHandlerController, type EventHandlersMap } from "../events.js"
import {
  type PlaceholderList,
  type Placeholder,
  type PlaceholderContent,
  type PlaceholderContext,
  appendNodeAt,
  type Place,
  ParentNodePlace,
} from "../core/index.js"

export type RenderedType = "placeholder" | "list" | "component"

export interface RenderedPlaceholder {
  type: "placeholder"
  content: PlaceholderContent
  handler?: (placeholder: Placeholder) => void
  context: PlaceholderContext
}

export interface RenderedList {
  type: "list"
  contents: PlaceholderContent[]
  handler?: (list: PlaceholderList) => void
  context: PlaceholderContext
}

export interface RenderedComponent {
  type: "component"
  content: PlaceholderContent
  context: PlaceholderContext
}

export type TemplateItem = ScalarValue | Node | RenderedPlaceholder | RenderedList | RenderedComponent

export type ElementHandler = (element: HTMLElement) => void
export type AttributeHandler = (element: HTMLElement, attr: string) => void

export type TemplateElementAttrsMap = Record<string, ScalarValue | AttributeHandler>

export const on =
  (context: PlaceholderContext, handlers: EventHandlersMap): ElementHandler =>
  (element) => {
    const res = new EventHandlerController(element, handlers)
    context.appendLifecycle(res)
    return res
  }

const processRendered = (place: Place, content: TemplateItem[]): Place => {
  for (const rendered of content) {
    if (typeof rendered === "boolean" || rendered == null) {
      return place
    }
    if (typeof rendered === "string") {
      place = appendNodeAt(place, txt(rendered))
    } else if (typeof rendered === "number") {
      place = appendNodeAt(place, txt(rendered.toString()))
    } else if (rendered instanceof Node) {
      place = appendNodeAt(place, rendered)
    } else if (rendered.type === "placeholder") {
      const plh = rendered.context.createPlaceholderAt(place, rendered.content)
      rendered.handler?.(plh)
      place = plh
    } else if (rendered.type === "list") {
      const list = rendered.context.createListAt(place, rendered.contents)
      rendered.handler?.(list)
      place = list
    } else if (rendered.type === "component" && rendered.content != null) {
      place = rendered.content(place, rendered.context)
    }
  }
  return place
}

export const el =
  (tag: string, attrs: TemplateElementAttrsMap | null = null, ...handlers: ElementHandler[]) =>
  (...children: TemplateItem[]): HTMLElement => {
    const element = dce(tag)

    processRendered(new ParentNodePlace(element), children)

    if (attrs != null) {
      for (const [name, value] of Object.entries(attrs)) {
        if (typeof value === "function") {
          value(element, name)
        } else {
          setAttr(element, name, value)
        }
      }
    }

    for (const handler of handlers) {
      handler(element)
    }
    return element
  }

export const plh = (
  context: PlaceholderContext,
  content: PlaceholderContent,
  handler?: (placeholder: Placeholder) => void,
): RenderedPlaceholder => ({
  type: "placeholder",
  content,
  handler,
  context,
})

export const list = (
  context: PlaceholderContext,
  contents: PlaceholderContent[],
  handler?: (list: PlaceholderList) => void,
): RenderedList => ({
  type: "list",
  contents,
  handler,
  context,
})

export const cmpnt = (context: PlaceholderContext, content: PlaceholderContent): RenderedComponent => ({
  type: "component",
  content,
  context,
})

export const fr =
  (...content: TemplateItem[]): PlaceholderContent =>
  (place, context) => processRendered(place, content)

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
