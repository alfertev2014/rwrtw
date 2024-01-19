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
} from "../core/index.js"

export type TemplateHandler<T> = (element: T, context: PlaceholderContext) => void
export type AttributeHandler = (attr: string, element: HTMLElement, context: PlaceholderContext) => void

export type TemplateElementAttrsMap = Record<string, ScalarValue | AttributeHandler>

export const el =
  (tag: string, attrs: TemplateElementAttrsMap | null = null, ...handlers: Array<TemplateHandler<HTMLElement>>) =>
  (...children: TemplateContent[]): PlaceholderComponent =>
  (place, context) => {
    const element = dce(tag)

    renderTemplateContent(placeAtBeginningOf(element), context, children)

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

    for (const handler of handlers) {
      handler(element, context)
    }
    return element
  }

export const plh =
  (content: TemplateContent, handler?: TemplateHandler<Placeholder>): PlaceholderComponent =>
  (place, context) => {
    const res = createChildPlaceholderAt(place, context, fr(content))
    handler?.(res, context)
    return res
  }

export const list =
  (contents: TemplateContent[], handler?: TemplateHandler<PlaceholderList>): PlaceholderComponent =>
  (place, context) => {
    const list = createListAt(place, context, contents.map(fr))
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

export interface TemplateRef<T> {
  readonly current: T | undefined
  readonly bind: () => (value: T, context: PlaceholderContext) => void
}

export const ref = <T>(initValue?: T): TemplateRef<T> => {
  let _current = initValue
  return {
    get current() {
      return _current
    },
    bind() {
      return (value: T, context: PlaceholderContext) => {
        _current = value
        context.registerLifecycle({
          dispose() {
            _current = undefined
          },
        })
      }
    },
  }
}
