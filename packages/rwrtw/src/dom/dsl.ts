import { ScalarData } from "../types.js"
import { dce, setAttr } from "./helpers.js"

export type ElementAttrsMap = Record<string, ScalarData>

export type ChildrenItem = Node | ScalarData

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
      element.append(
        typeof child !== "string" && !(child instanceof Node)
          ? child.toString()
          : child,
      )
    }
    return element
  }
