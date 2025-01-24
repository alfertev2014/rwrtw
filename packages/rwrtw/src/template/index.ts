import { dce, setAttr, txt } from "../dom/helpers.js"
import {
  type PlaceholderList,
  type Placeholder,
  type PlaceholderContext,
  placeAtBeginningOf,
  type PlaceholderComponent,
  type Lifecycle,
  PlaceholderContent,
  Renderer,
} from "../core/index.js"
import { type ScalarData } from "../types.js"

export type TemplateHandler<T> = (element: T, context: PlaceholderContext) => void
export type TemplateElementAttrHandler<
  E extends HTMLElement = HTMLElement,
  A extends string = string,
> = (element: E, attrName: A, context: PlaceholderContext) => void

export type TemplateElementAttrsConfig<E extends HTMLElement = HTMLElement> = {
  [key: string]: ScalarData | TemplateElementAttrHandler<E, typeof key>
}

export const el: {
  <K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attrs?: TemplateElementAttrsConfig<HTMLElementTagNameMap[K]> | null,
    ...handlers: Array<TemplateHandler<HTMLElementTagNameMap[K]>>
  ): (...children: TemplateContent[]) => PlaceholderComponent
  /** @deprecated */
  <K extends keyof HTMLElementDeprecatedTagNameMap>(
    tag: K,
    attrs?: TemplateElementAttrsConfig<HTMLElementDeprecatedTagNameMap[K]> | null,
    ...handlers: Array<TemplateHandler<HTMLElementDeprecatedTagNameMap[K]>>
  ): (...children: TemplateContent[]) => PlaceholderComponent
  (
    tag: string,
    attrs?: TemplateElementAttrsConfig | null,
    ...handlers: Array<TemplateHandler<HTMLElement>>
  ): (...children: TemplateContent[]) => PlaceholderComponent
} =
  (
    tag: string,
    attrs?: TemplateElementAttrsConfig | null,
    ...handlers: Array<TemplateHandler<HTMLElement>>
  ) =>
  (...children: TemplateContent[]): PlaceholderComponent =>
  (renderer) => {
    const element = dce(tag)

    if (attrs != null) {
      for (const [name, value] of Object.entries(attrs)) {
        if (typeof value === "function") {
          value(element, name, renderer.context)
        } else {
          setAttr(element, name, value)
        }
      }
    }

    for (const handler of handlers) {
      handler(element, renderer.context)
    }

    renderTemplateContent(renderer.createRendererAt(element.lastChild ?? placeAtBeginningOf(element)), children)

    renderer.insertNode(element)
  }

export const plh =
  (content: PlaceholderContent, handler?: TemplateHandler<Placeholder>): PlaceholderComponent =>
  (renderer) => {
    const res = renderer.insertPlaceholder(content)
    handler?.(res, renderer.context)
  }

export const plhList =
  (
    contents: PlaceholderContent[],
    handler?: TemplateHandler<PlaceholderList>,
  ): PlaceholderComponent =>
  (renderer) => {
    const list = renderer.insertList(contents)
    handler?.(list, renderer.context)
  }

export const lc =
  (lifecycle: Lifecycle): PlaceholderComponent =>
  (renderer: Renderer) => {
    renderer.registerLifecycle(lifecycle)
  }

export type TemplateItem = ScalarData | PlaceholderComponent

export type TemplateContent = TemplateContent[] | TemplateItem

const renderTemplateContent = (
  renderer: Renderer,
  content: TemplateContent,
): void => {
  if (typeof content === "boolean" || content == null) {
    return
  }
  if (typeof content === "string") {
    renderer.insertNode(txt(content))
  } else if (typeof content === "number" || typeof content === "bigint") {
    renderer.insertNode(txt(content.toString()))
  } else if (typeof content === "function") {
    content(renderer)
  } else if (Array.isArray(content)) {
    for (const item of content) {
      renderTemplateContent(renderer, item)
    }
  }
}

export const fr =
  (...content: TemplateContent[]): PlaceholderComponent =>
  (renderer) => {
    return renderTemplateContent(renderer, content)
  }

export const on: {
  <K extends keyof HTMLElementEventMap, H extends HTMLElement = HTMLElement>(
    event: K,
    listener: (this: H, ev: HTMLElementEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): TemplateHandler<H>
  (
    event: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): TemplateHandler<HTMLElement>
} =
  (
    event: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): TemplateHandler<HTMLElement> =>
  (element, context) => {
    element.addEventListener(event, listener, options)
    context.registerLifecycle({
      dispose() {
        element.removeEventListener(event, listener, options)
      },
    })
  }

export const attr =
  (name: string, value: ScalarData): TemplateHandler<HTMLElement> =>
  (element) => {
    setAttr(element, name, value)
  }

export const prop =
  <T extends HTMLElement, N extends keyof T>(name: N, value: T[N]): TemplateHandler<T> =>
  (element) => {
    element[name] = value
  }

export const ev =
  (
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): TemplateElementAttrHandler =>
  (element, eventName, context) => {
    element.addEventListener(eventName, listener, options)
    context.registerLifecycle({
      dispose() {
        element.removeEventListener(eventName, listener, options)
      },
    })
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
