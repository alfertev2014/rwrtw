import { ScalarData } from "../types.js"

/**
 * Set attribute of HTML element.
 *
 * @param element HTML to set attribute value
 * @param name Name of the attribute
 * @param value New value of the attribute. If it is falsy value, the attribute will be removed.
 */
export const setAttr = (
  element: Element,
  name: string,
  value: ScalarData,
): void => {
  if (value != null && value !== false) {
    element.setAttribute(name, value === true ? "" : value.toString())
  } else {
    element.removeAttribute(name)
  }
}

/**
 * Abbreviation for the document.createElement.
 *
 * @param tag HTML element name
 * @returns HTML element node
 */
export const dce: {
  <K extends keyof HTMLElementTagNameMap>(tagName: K): HTMLElementTagNameMap[K]
  /** @deprecated */
  <K extends keyof HTMLElementDeprecatedTagNameMap>(
    tagName: K,
  ): HTMLElementDeprecatedTagNameMap[K]
  (tagName: string): HTMLElement
} = (tag: string): HTMLElement => document.createElement(tag)

export const toText = (value: ScalarData) =>
  value != null && typeof value !== "boolean" ? value.toString() : ""

/**
 * Abbreviation for the document.createTextNode.
 *
 * @param str String content of text node.
 * @returns HTML text node.
 */
export const txt = (value: ScalarData): Text =>
  document.createTextNode(toText(value))
