import { dce, setAttr, txt } from "../dom/helpers.js"
import {
  type PlaceholderList,
  type Placeholder,
  placeAtBeginningOf,
  type PlaceholderComponent,
  type Lifecycle,
  type PlaceholderContent,
  type Renderer,
} from "../core/index.js"
import { type ScalarData } from "../types.js"
import type {
  TemplateContent,
  TemplateElementAttrsConfig,
  TemplateHandler,
} from "./types.js"

export type TagToHTMLElement<T extends string> = T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : HTMLElement
export type PropsOfElement<E extends HTMLElement> = {
  [K in keyof E as E[K] extends () => unknown ? never : K]: E[K]
}

export const el: {
  <K extends string>(
    tag: K,
    attrs?: TemplateElementAttrsConfig | null,
    ...handlers: Array<TemplateHandler<TagToHTMLElement<K>>>
  ): (...children: TemplateContent[]) => PlaceholderComponent
  /** @deprecated */
  <K extends keyof HTMLElementDeprecatedTagNameMap>(
    tag: K,
    attrs?: TemplateElementAttrsConfig | null,
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
        setAttr(element, name, value)
      }
    }

    for (const handler of handlers) {
      handler(element, renderer.context)
    }

    renderTemplateContent(
      renderer.createRendererAt(
        element.lastChild ?? placeAtBeginningOf(element),
      ),
      children,
    )

    renderer.insertNode(element)
  }

export const plh =
  (
    content: PlaceholderContent,
    handler?: TemplateHandler<Placeholder>,
  ): PlaceholderComponent =>
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

export const cmpnt =
  (component: () => PlaceholderContent): PlaceholderContent =>
  (renderer) =>
    component()?.(renderer)

export const fr =
  (...content: TemplateContent[]): PlaceholderComponent =>
  (renderer) => {
    renderTemplateContent(renderer, content)
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
  <T extends HTMLElement, N extends keyof T>(
    name: N,
    value: T[N],
  ): TemplateHandler<T> =>
  (element) => {
    element[name] = value
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
