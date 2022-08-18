import { ComponentFactory, Lifecycles, Placeholder } from './component'
import { dce, ElementAttrsMap, txt } from './dom'
import { EventHandlerController, EventHandlersMap } from './events'
import { Place, renderNode } from './place'

export type TemplateElement = ComponentFactory | Node | string | number | boolean | null | undefined

export type Template = TemplateElement | Template[]

const renderTemplate = (place: Place, parent: Lifecycles, template: Template): Place => {
    if (typeof template === 'boolean' || !template) {
        return place
    }
    let lastPlace = place
    if (typeof template === 'string') {
        lastPlace = renderNode(lastPlace, txt(template))
    } else if (typeof template === 'number') {
        lastPlace = renderNode(lastPlace, txt(template.toString()))
    } else if (template instanceof Node) {
        lastPlace = renderNode(lastPlace, template)
    } else if (Array.isArray(template)) {
        for (const subtemplate of template) {
            lastPlace = renderTemplate(lastPlace, parent, subtemplate)
        }
    } else {
        const rendered = template(lastPlace, parent)
        if (rendered.component instanceof Lifecycles) {
            parent.addLifecycle(rendered.component)
        }
        lastPlace = rendered.lastPlace
    }
    return lastPlace
}

export const el = (
    tag: string,
    attrs: ElementAttrsMap | null = null,
    on: EventHandlersMap | null = null
) => {
    return (...children: Template[]): ComponentFactory<HTMLElement> =>
        (place: Place, parent: Lifecycles) => {
            const element = dce(tag, attrs)
            const rendered = renderNode(place, element)
            renderTemplate({ parent: rendered }, parent, children)
            if (on) {
                parent.addLifecycle(new EventHandlerController(element, on))
            }
            return { lastPlace: rendered, component: rendered }
        }
}

export const fr = (...children: Template[]): ComponentFactory => {
    return (place: Place, parent: Lifecycles) => ({
        lastPlace: renderTemplate(place, parent, children),
        component: null,
    })
}

export const plh = (componentFunc: ComponentFactory): ComponentFactory<Placeholder> => {
    return (place: Place) => {
        const h = new Placeholder(place)
        h.renderContent(componentFunc)
        return { lastPlace: h, component: h }
    }
}

export class TemplateRef<T> {
    _current: T | null = null
    get current(): T {
        if (!this._current) {
            throw Error('Invalid usage of TemplateRef')
        }
        return this._current
    }
}

export const createRef = <T>() => new TemplateRef<T>()

export const ref = <T>(
    ref: TemplateRef<T>,
    renderFunc: ComponentFactory<T>
): ComponentFactory<T> => {
    return (place: Place, parent: Lifecycles) => {
        const rendered = renderFunc(place, parent)
        ref._current = rendered.component
        return rendered
    }
}
