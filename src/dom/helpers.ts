/**
 * Value type for elements' attributes.
 */
export type ElementAttrValue = number | string | boolean | null | undefined

/**
 * Set attribute of HTML element.
 *
 * @param element HTML to set attribute value
 * @param name Name of the attribute
 * @param value New value of the attribute. If it is falsy value, the attribute will be removed.
 */
export const setAttr = (element: Element, name: string, value: ElementAttrValue) => {
  if (value) {
    element.setAttribute(name, value === true ? "" : value.toString())
  } else if (value === null || value === false || typeof value === "undefined") {
    element.removeAttribute(name)
  }
}

/**
 * Abbreviation for the document.createElement.
 *
 * @param tag HTML element name
 * @returns HTML element node
 */
export const dce = (tag: string) => document.createElement(tag)

/**
 * Abbreviation for the document.createTextNode.
 *
 * @param str String content of text node.
 * @returns HTML text node.
 */
export const txt = (str: string) => document.createTextNode(str)
