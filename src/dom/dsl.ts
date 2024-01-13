import { dce, setAttr, type ScalarValue } from "./helpers.js"

export type ElementAttrsMap = Record<string, ScalarValue>

export type ChildrenItem = Node | ScalarValue

export const hel =
  (tag: string, attrs: ElementAttrsMap | null = null) =>
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
      element.append(typeof child === "number" ? child.toString() : child)
    }
    return element
  }
