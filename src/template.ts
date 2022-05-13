import { Component, ComponentFactory, Hidable, ParentComponent, Placeholder } from './component'
import { dce, ElementAttrsMap, txt } from './dom'
import { EventHandlerController, EventHandlersMap } from './events'
import { Place, renderNode } from './place'

export type TemplateElement = ComponentFactory | Node | string | number | boolean | null | undefined

export type Template = TemplateElement | Template[]

const renderTemplate = (place: Place, parent: ParentComponent, template: Template): Place => {
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
        if (rendered.component instanceof Component) {
            parent.addLifecycle(rendered.component)
        }
        lastPlace = rendered.lastPlace
    }
    return lastPlace
}

export const el = (tag: string, attrs: ElementAttrsMap | null = null, on: EventHandlersMap | null = null) => {
    return (...children: Template[]): ComponentFactory<HTMLElement> =>
        (place: Place, parent: ParentComponent) => {
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
    return (place: Place, parent: ParentComponent) => ({
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

export const hidable = <T extends Component | HTMLElement>(
    componentFunc: ComponentFactory<T>
): ComponentFactory<Hidable<T>> => {
    return (place: Place, parent: ParentComponent) => {
        const h = new Hidable<T>(place, parent, componentFunc)
        return { lastPlace: h.lastPlace, component: h }
    }
}

export class TemplateRef<T extends Component | HTMLElement> {
    _current: T | null = null
    get current(): T {
        if (!this._current) {
            throw Error('Invalid usage of TemplateRef')
        }
        return this._current
    }
}

export const createRef = <T extends Component | HTMLElement>() => new TemplateRef<T>()

export const ref = <T extends Component | HTMLElement>(
    ref: TemplateRef<T>,
    renderFunc: ComponentFactory<T>
): ComponentFactory<T> => {
    return (place: Place, parent: ParentComponent) => {
        const rendered = renderFunc(place, parent)
        ref._current = rendered.component
        return rendered
    }
}
