export type ElementAttrValue = number | string | boolean | null | undefined

export const setAttr = (element: Element, name: string, value: ElementAttrValue) => {
    if (value) {
        element.setAttribute(name, value === true ? '' : value.toString())
    } else if (value === null || value === false || typeof value === "undefined") {
        element.removeAttribute(name)
    }
}

export const dce = (tag: string) => document.createElement(tag)

export const txt = (str: string) => document.createTextNode(str)
