import { Component, ComponentFactory, Hidable, ParentComponent, Placeholder } from './component'
import { dce, ElementAttrsMap, txt } from './dom'
import { EventHandlerController, EventHandlersMap } from './events'
import { Place, renderNode } from './place'

class ElementFactory {
    readonly tag: string
    readonly attrs: ElementAttrsMap | null
    readonly on: EventHandlersMap | null
    readonly template: Template
    constructor(
        tag: string,
        attrs: ElementAttrsMap | null = null,
        on: EventHandlersMap | null = null,
        template: Template
    ) {
        this.tag = tag
        this.attrs = attrs
        this.on = on
        this.template = template
    }

    render(place: Place, parent: ParentComponent): HTMLElement {
        const element = dce(this.tag, this.attrs)
        const rendered = renderNode(place, element)
        renderTemplate({ parent: rendered }, parent, this.template)
        if (this.on) {
            parent.addLifecycle(new EventHandlerController(element, this.on))
        }
        return rendered
    }
}

export type TemplateElement = ComponentFactory | ElementFactory | Node | string | number | boolean | null | undefined

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
    } else if (template instanceof ElementFactory) {
        lastPlace = template.render(lastPlace, parent)
    } else {
        const rendered = template(lastPlace, parent)
        if (rendered.component) {
            parent.addLifecycle(rendered.component)
        }
        lastPlace = rendered.lastPlace
    }
    return lastPlace
}

export const el = (tag: string, attrs: ElementAttrsMap | null = null, on: EventHandlersMap | null = null) => {
    return (...children: Template[]) => new ElementFactory(tag, attrs, on, children)
}

export const fr = (...children: Template[]): ComponentFactory => {
    return (place: Place, parent: ParentComponent) => ({
        lastPlace: renderTemplate(place, parent, children),
        component: null
    })
}

export const plh = (componentFunc: ComponentFactory): ComponentFactory<Placeholder> => {
    return (place: Place) => {
        const h = new Placeholder(place)
        h.renderContent(componentFunc)
        return { lastPlace: h, component: h }
    }
}

export const hidable = <T extends Component>(componentFunc: ComponentFactory<T>): ComponentFactory<Hidable<T>> => {
    return (place: Place) => {
        const h = new Hidable<T>(place, componentFunc)
        return { lastPlace: h, component: h }
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

export const ref = <T extends Component>(
    ref: TemplateRef<T> | TemplateRef<HTMLElement>,
    renderFunc: ComponentFactory<T> | ElementFactory
): ComponentFactory<T> | ElementFactory => {
    if (renderFunc instanceof ElementFactory) {
        const proxy = {
            render(place: Place, parent: ParentComponent) {
                return (ref._current = renderFunc.render(place, parent))
            },
        }
        Object.setPrototypeOf(proxy, renderFunc)
        return proxy as ElementFactory // TODO: Need to avoid the cast
    }
    return (place: Place, parent: ParentComponent) => {
        const rendered = renderFunc(place, parent)
        ref._current = rendered.component
        return rendered
    }
}
