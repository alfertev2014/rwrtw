export type ElementAttrValue = number | string | boolean | null | undefined

export const setAttr = (element: Element, name: string, value: ElementAttrValue) => {
    if (value) {
        element.setAttribute(name, value === true ? '' : value.toString())
    } else if (value === null || value === false || value === undefined) {
        element.removeAttribute(name)
    }
}

export interface ElementAttrsMap {
    [key: string]: ElementAttrValue
}

export const setAttrs = (element: Element, attrs: ElementAttrsMap) => {
    for (const [name, value] of Object.entries(attrs)) {
        setAttr(element, name, value)
    }
}

export const dce = (tag: string, attrs?: ElementAttrsMap | null, ...children: (string | Node)[]) => {
    const element = document.createElement(tag)
    if (attrs) {
        setAttrs(element, attrs)
    }
    element.append(...children)
    return element
}

export const txt = (str: string) => document.createTextNode(str)