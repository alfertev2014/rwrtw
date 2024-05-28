import { dce, setAttr, type ScalarValue, txt } from "../dom/helpers.js"
import {
  type PlaceholderList,
  type Placeholder,
  type PlaceholderContext,
  type Place,
  placeAtBeginningOf,
  type PlaceholderComponent,
  createChildPlaceholderAt,
  createListAt,
  insertNodeAt,
  type Lifecycle,
  PlaceholderContent,
} from "../core/index.js"

export type TemplateHandler<T> = (element: T, context: PlaceholderContext) => void
export type TemplateElementAttrHandler = (element: HTMLElement, context: PlaceholderContext, attrName: string) => void

export type TemplateElementAttrsMap = Record<string, ScalarValue | TemplateElementAttrHandler>

export const el =
  (tag: string, attrs?: TemplateElementAttrsMap | null, ...handlers: Array<TemplateHandler<HTMLElement>>) =>
  (...children: TemplateContent[]): PlaceholderComponent =>
  (place, context) => {
    const element = dce(tag)

    if (attrs != null) {
      for (const [name, value] of Object.entries(attrs)) {
        if (typeof value === "function") {
          value(element, context, name)
        } else {
          setAttr(element, name, value)
        }
      }
    }

    for (const handler of handlers) {
      handler(element, context)
    }

    renderTemplateContent(element.lastChild ?? placeAtBeginningOf(element), context, children)

    return insertNodeAt(place, element)
  }

export const plh =
  (content: PlaceholderContent, handler?: TemplateHandler<Placeholder>): PlaceholderComponent =>
  (place, context) => {
    const res = createChildPlaceholderAt(place, context, content)
    handler?.(res, context)
    return res
  }

export const plhList =
  (contents: PlaceholderContent[], handler?: TemplateHandler<PlaceholderList>): PlaceholderComponent =>
  (place, context) => {
    const list = createListAt(place, context, contents)
    handler?.(list, context)
    return list
  }

export const lc =
  (lifecycle: Lifecycle): PlaceholderComponent =>
  (place, context) => {
    context.registerLifecycle(lifecycle)
    return place
  }

export type TemplateItem = ScalarValue | PlaceholderComponent

export type TemplateContent = TemplateContent[] | TemplateItem

const renderTemplateContent = (place: Place, context: PlaceholderContext, content: TemplateContent): Place => {
  if (typeof content === "boolean" || content == null) {
    return place
  }
  if (typeof content === "string") {
    place = insertNodeAt(place, txt(content))
  } else if (typeof content === "number") {
    place = insertNodeAt(place, txt(content.toString()))
  } else if (typeof content === "function") {
    place = content(place, context)
  } else if (Array.isArray(content)) {
    for (const item of content) {
      place = renderTemplateContent(place, context, item)
    }
  }
  return place
}

export const fr =
  (...content: TemplateContent[]): PlaceholderComponent =>
  (place, context) => {
    return renderTemplateContent(place, context, content)
  }

export const on: (...args: Parameters<HTMLElement["addEventListener"]>) => TemplateHandler<HTMLElement> =
  (event, listener, options) => (element) => {
    element.addEventListener(event, listener, options)
  }

export const ev =
  (
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): TemplateElementAttrHandler =>
  (element, context, eventName) => {
    element.addEventListener(eventName, listener, options)
  }

export interface TemplateRefObject<T> {
  current?: T | undefined
}

export type TemplateRefCallback<T> = (value: T | undefined) => void

export type TemplateRef<T> = TemplateRefObject<T> | TemplateRefCallback<T>

export const createRef = <T>(initValue?: T): TemplateRefObject<T> => {
  return { current: initValue }
}

export const ref = <T>(ref: TemplateRef<T>): TemplateHandler<T> => {
  if (typeof ref === "function") {
    return (value, context) => {
      ref(value)
      context.registerLifecycle({
        dispose() {
          ref(undefined)
        },
      })
    }
  } else {
    return (value, context) => {
      ref.current = value
      context.registerLifecycle({
        dispose() {
          ref.current = undefined
        },
      })
    }
  }
}
