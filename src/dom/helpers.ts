import { ParentNodePlace, Place, renderNode } from "../internal/place"

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
        element.setAttribute(name, value === true ? '' : value.toString())
    } else if (value === null || value === false || typeof value === 'undefined') {
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

export interface ElementAttrsMap {
    [key: string]: ElementAttrValue
}

export type ChildrenItem = HTMLElement | ElementAttrValue
export type ChildrenType = ChildrenItem | ChildrenType[]

export const hel =
    (tag: string, attrs: ElementAttrsMap | null = null, ...handlers: ((e: HTMLElement) => void)[]) =>
    (...children: ChildrenType[]): Place => {
    const element = dce(tag)

    processRendered(new ParentNodePlace(element), children)

    if (attrs) {
        for (const [name, value] of Object.entries(attrs)) {
            setAttr(element, name, value)
        }
    }
    for (const handler of handlers) {
        handler(element)
    }
    return element
}

const processRendered = (
    place: Place,
    rendered: ChildrenType,
): Place => {
    if (typeof rendered === 'boolean' || rendered === null || typeof rendered === 'undefined') {
        return place
    }
    if (typeof rendered === 'string') {
        place = renderNode(place, txt(rendered))
    } else if (typeof rendered === 'number') {
        place = renderNode(place, txt(rendered.toString()))
    } else if (Array.isArray(rendered)) {
        for (const r of rendered) {
            place = processRendered(place, r)
        }
    } else {
        place = renderNode(place, rendered)
    }
    return place
}