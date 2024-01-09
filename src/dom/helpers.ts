/**
 * Value type for elements' attributes.
 */
export type ScalarValue = number | string | boolean | null | undefined

/**
 * Set attribute of HTML element.
 *
 * @param element HTML to set attribute value
 * @param name Name of the attribute
 * @param value New value of the attribute. If it is falsy value, the attribute will be removed.
 */
export const setAttr = (element: Element, name: string, value: ScalarValue): void => {
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
export const dce = (tag: string): HTMLElement => document.createElement(tag)

/**
 * Abbreviation for the document.createTextNode.
 *
 * @param str String content of text node.
 * @returns HTML text node.
 */
export const txt = (str: string): Text => document.createTextNode(str)
