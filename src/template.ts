import { ComponentFactory, Renderer } from './component'
import { dce, ElementAttrsMap } from './dom'
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

export const el =
    (tag: string, attrs: ElementAttrsMap | null = null, on: EventHandlersMap | null = null) =>
    (...children: Template[]): ComponentFactory<HTMLElement> =>
    (renderer: Renderer) => {
        const element = dce(tag, attrs)
        const subrenderer = renderer.renderElement(element)
        renderTemplate(subrenderer, children)
        if (on) {
            renderer.addLifecycle(new EventHandlerController(element, on))
        }
        return element
    }

export const fr = (...children: Template[]): ComponentFactory => {
    return (renderer: Renderer) => {
        renderTemplate(renderer, children)
        return null
    }
}
