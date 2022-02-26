import { Component, ComponentFactory, Hidable, ParentComponent } from './component'
import { dce, ElementAttrsMap, txt } from './dom'
import { EventHandlerController, EventHandlersMap } from './events'
import { DOMPlace, Place, renderNode } from './place'

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

const renderComponent = <T extends Component>(
    place: Place,
    parent: ParentComponent,
    componentFunc: ComponentFactory<T>
): T => {
    const component = componentFunc(place, parent)
    component.render()
    parent.addLifecycle(component)
    return component
}

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
    } else if (typeof template === 'function') {
        lastPlace = renderComponent(lastPlace, parent, template)
    } else if (Array.isArray(template)) {
        for (const subtemplate of template) {
            lastPlace = renderTemplate(lastPlace, parent, subtemplate)
        }
    } else if (template instanceof ElementFactory) {
        lastPlace = template.render(lastPlace, parent)
    } else {
        parent.addLifecycle(template)
    }
    return lastPlace
}

export class TemplateComponent extends ParentComponent {
    template: Template
    constructor(template: Template, place: Place, parent: Component | null) {
        super(place, parent)
        this.template = template
    }

    render(): void {
        this.lastPlace = renderTemplate(this.place, this, this.template)
    }
}

export const el = (tag: string, attrs: ElementAttrsMap | null = null, on: EventHandlersMap | null = null) => {
    return (...children: Template[]) => new ElementFactory(tag, attrs, on, children)
}

export const fr = (...children: Template[]): ComponentFactory<TemplateComponent> => {
    return (place: Place, parent: Component | null) => new TemplateComponent(children, place, parent)
}

export const hidable = <T extends Component>(componentFunc: ComponentFactory<T>): ComponentFactory<Hidable<T>> => {
    return (place: Place, parent: Component | null) => new Hidable(componentFunc, place, parent)
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
    return (place: Place, parent: Component | null) => {
        return (ref._current = renderFunc(place, parent))
    }
}

export const renderTo = (place: DOMPlace, ...children: Template[]): Component => {
    const component = new TemplateComponent(children, place, null)
    component.render()
    return component
}
