import { dce, setAttr, type ScalarValue } from "./helpers.js"

export type ElementAttrsMap = Record<string, ScalarValue>

export type ChildrenItem = HTMLElement | ScalarValue

export const hel =
  (tag: string, attrs: ElementAttrsMap | null = null, ...handlers: Array<(e: HTMLElement) => void>) =>
  (...children: ChildrenItem[]): HTMLElement => {
    const element = dce(tag)

    if (attrs != null) {
      for (const [name, value] of Object.entries(attrs)) {
        setAttr(element, name, value)
      }
    }

    for (const child of children) {
      if (typeof child === "boolean" || child == null) {
        continue
      }
      if (typeof child === "number") {
        element.append(child.toString())
      } else {
        element.append(child)
      }
    }

    for (const handler of handlers) {
      handler(element)
    }
    return element
  }
