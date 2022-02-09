import { Component, ParentComponent } from "component"
import { dce, ElementAttrsMap, txt } from "dom"
import { EventHandlerController, EventHandlersMap } from "events"
import { Place, renderNode } from "place"

export interface ComponentFactory<T extends Component> {
    (place: Place, parent: Component | null): T
}

export interface RenderFunction<T extends Component | Element | null = null> {
    (renderer: Renderer): T
}

export type TemplateElement = RenderFunction | Node | string | number | boolean | null | undefined

export type Template = TemplateElement | Template[]

class Renderer {
    place: Place
    parent: ParentComponent
    constructor(place: Place, parent: ParentComponent) {
        this.place = place
        this.parent = parent
    }

    renderNode<T extends Node>(node: T): T {
        const rendered = renderNode(this.place, node)
        this.place = rendered
        return rendered
    }

    renderComponent<T extends Component>(componentFunc: ComponentFactory<T>): T {
        const component = componentFunc(this.place, this.parent)
        this.parent.addLifecycle(component)
        this.place = component
        return component
    }

    createSubrenderer() {
        return new Renderer(this.place, this.parent)
    }

    renderTemplate(template: Template): void {
        if (typeof template === 'boolean' || !template) {
            return
        }
        if (typeof template === 'string'){
            this.renderNode(txt(template))
        } else if (typeof template === 'number') {
            this.renderNode(txt(template.toString()))
        } else if (template instanceof Node) {
            this.renderNode(template)
        } else if (typeof template === 'function') {
            template(this)
        } else if (Array.isArray(template)) {
            for (const subtemplate of template) {
                this.renderTemplate(subtemplate)
            }
        } else {
            this.parent.addLifecycle(template)
        }
    }
}

export const el = (tag: string, attrs: ElementAttrsMap | null = null, on: EventHandlersMap | null = null) => {
    return (...children: Template[]) =>
        (renderer: Renderer) => {
            const element = dce(tag, attrs)
            renderer.renderNode(element)
            const subrenderer = renderer.createSubrenderer()
            subrenderer.renderTemplate(children)
            if (on) {
                renderer.parent.addLifecycle(new EventHandlerController(element, on))
            }
            return element
        }
}

export const cmpnt = <T extends Component>(componentFunc: ComponentFactory<T>) => (renderer: Renderer) => {
    return renderer.renderComponent(componentFunc)
}

export class TemplateRef<T extends Component | Element> {
    _current: T | null = null
    get current(): T {
        if (!this._current) {
            throw Error('Invalid usage of TemplateRef')
        }
        return this._current
    }
}

export const createRef = <T extends Component | Element>() => new TemplateRef<T>()

export const ref = <T extends Component | Element>(ref: TemplateRef<T>, renderFunc: RenderFunction<T>) => {
    return (renderer: Renderer) => {
        return (ref._current = renderFunc(renderer))
    }
}
