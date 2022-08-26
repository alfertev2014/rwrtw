import { ComponentFactory, Lifecycle, Renderer } from './component'
import { ElementAttrValue, setAttr } from './dom'
import { EventHandlerController, EventHandlersMap } from './events'

export type TemplateElement = ComponentFactory | Node | string | number | boolean | null | undefined

export type Template = TemplateElement | Template[]

const renderTemplate = (renderer: Renderer, template: Template) => {
    if (typeof template === 'boolean' || template === null || typeof template === 'undefined') {
        return
    }
    if (typeof template === 'string') {
        renderer.renderText(template)
    } else if (typeof template === 'number') {
        renderer.renderText(template.toString())
    } else if (template instanceof Node) {
        renderer.renderDomNode(template)
    } else if (Array.isArray(template)) {
        for (const subtemplate of template) {
            renderTemplate(renderer, subtemplate)
        }
    } else {
        template(renderer)
    }
}

export type ElementHandler = (element: HTMLElement) => Lifecycle | undefined
export type AttributeHandler = (element: HTMLElement, attr: string) => Lifecycle | undefined

export interface TemplateElementAttrsMap {
    [key: string]: ElementAttrValue | AttributeHandler
}

export const on =
    (handlers: EventHandlersMap): ElementHandler =>
    (element) =>
        new EventHandlerController(element, handlers)

export const el =
    (tag: string, attrs: TemplateElementAttrsMap | null = null, ...handlers: ElementHandler[]) =>
    (...children: Template[]): ComponentFactory<HTMLElement> =>
    (renderer: Renderer) => {
        const element = renderer.renderElement(tag, fr(children))
        if (attrs) {
            for (const [name, value] of Object.entries(attrs)) {
                if (typeof value === 'function') {
                    renderer.addLifecycle(value(element, name))
                } else {
                    setAttr(element, name, value)
                }
            }
        }
        for (const handler of handlers) {
            renderer.addLifecycle(handler(element))
        }
        return element
    }

export const text =
    (data: string, handler?: (node: Text) => Lifecycle | undefined): ComponentFactory<Text> =>
    (renderer: Renderer) => {
        const node = renderer.renderText(data)
        if (handler) {
            renderer.addLifecycle(handler(node))
        }
        return node
    }

export const fr = (...children: Template[]): ComponentFactory => {
    return (renderer: Renderer) => {
        renderTemplate(renderer, children)
        return null
    }
}
