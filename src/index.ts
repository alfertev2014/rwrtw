
export type ElementAttrValue = number | string | boolean | null | undefined

export const setAttr = (element: Element, name: string, value: ElementAttrValue) => {
    if (value) {
        element.setAttribute(name, value === true ? '' : value.toString())
    } else if (value === null || value === false) {
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

export const dce = (tag: string, attrs?: ElementAttrsMap | null, ...children: Node[]) => {
    const element = document.createElement(tag)
    if (attrs) {
        setAttrs(element, attrs)   
    }
    for (const node of children) {
        element.appendChild(node)
    }
    return element
}

export const txt = (str: string) => document.createTextNode(str)

export interface Lifecycle {
    mount?: () => void
    unmount?: () => void
}

const isLifecycle = (lifecycle: any): lifecycle is Lifecycle => {
    return typeof lifecycle?.mount === 'function' || typeof lifecycle?.unmount === 'function'
}


type DOMPlace = Node | { parent: Node }

type Place = DOMPlace | Component

const lastPlaceNode = (place: Place) => {
    if (place instanceof Component) {
        return place.lastNode
    } else {
        return place
    }
}

export abstract class Component implements Lifecycle {
    _parent: Component | null = null
    _place: Place | null = null
    _lastPlace: Place | null = null

    get place(): Place {
        if (! this._place) {
            throw new Error("Component is not attached (place is null)")
        }
        return this._place
    }

    get parent(): Component | null {
        return this._parent
    }

    get lastNode(): DOMPlace {
        if (! this._lastPlace) {
            throw new Error("Component is not attached (lastPlace is null)")
        }
        return lastPlaceNode(this._lastPlace)
    }

    get isHidden() {
        return this._place && this._lastPlace === this._place
    }

    attach(place: Place, parent: Component | null = null) {
        this._place = place
        this._lastPlace = place
        this._parent = parent
        this.renderNodes()
    }

    renderNodes() {
        if (this.isHidden) {
            this._lastPlace = this.render()
        }
    }

    abstract render(): Place
    abstract mount(): void
    abstract unmount(): void

    detach() {
        this.unrenderNodes()
        this._place = null
        this._lastPlace = null
        this._parent = null
    }

    unrenderNodes() {
        let domPlace: DOMPlace | null = this.lastNode
        if (domPlace instanceof Node) {
            const firstDomPlace = this.place ? lastPlaceNode(this.place) : null
            const firstNode = firstDomPlace instanceof Node ? firstDomPlace : null;
            while (domPlace && domPlace !== firstNode) {
                const toRemove = domPlace
                domPlace = domPlace.previousSibling
                toRemove.parentNode?.removeChild(toRemove)
            }
        }
        this._lastPlace = this._place
    }
}

interface ComponentFunction<T extends Element | Component> {
    (renderer: Renderer): T;
}

type TemplateElement = ComponentFunction<Element | Component> | TemplateRef<Element | Component> | Component | Lifecycle | Node | boolean | string | number | null | undefined

type Template = TemplateElement | Template[]

class Renderer {
    parent: Component
    lastPlace: Place
    lifecycles: Lifecycle[]
    constructor(parent: Component, place: Place, lifecycles: Lifecycle[] = []) {
        this.parent = parent
        this.lastPlace = place
        this.lifecycles = lifecycles
    }

    get lastNode(): DOMPlace {
        return lastPlaceNode(this.lastPlace)
    }

    insertNode(node: Node) {
        const lastInsertingNode = node instanceof DocumentFragment ? node.lastChild : node
        if (lastInsertingNode) {
            const domPlace = lastPlaceNode(this.lastPlace)
            if (domPlace instanceof Node) {
                domPlace.parentNode?.insertBefore(node, domPlace.nextSibling)
            } else {
                domPlace.parent.appendChild(node)
            }
            this.lastPlace = lastInsertingNode
        }
    }

    insertComponent(component: Component) {
        component.attach(this.lastPlace, this.parent)
        this.lastPlace = component
    }

    pushLifecycle(lifecycle: Lifecycle) {
        this.lifecycles.push(lifecycle)
        return lifecycle
    }

    renderTemplate(template: Template) {
        if (typeof template === 'boolean' || template === null || typeof template === 'undefined') {
            return;
        }
        if (typeof template === 'function') {
            template(this)
        } else if (typeof template === 'string' || typeof template === 'number') {
            const node = document.createTextNode(String(template))
            this.insertNode(node)
        } else if (template instanceof Node) {
            this.insertNode(template)
        } else if (template instanceof Component) {
            this.insertComponent(template)
        } else if (template instanceof TemplateRef) {
            template.render(this)
        } else if (Array.isArray(template)) {
            for (const child of template) {
                this.renderTemplate(child)
            }
        } else if (isLifecycle(template)) {
            this.pushLifecycle(template)
        }
    }

    renderElement(element: Element, children: Template) {
        this.insertNode(element)
        const renderer = new Renderer(this.parent, { parent: element }, this.lifecycles)
        renderer.renderTemplate(children)
    }
}

class TemplateComponent extends Component {
    readonly template: Template
    lifecycles: Lifecycle[]
    constructor(template: Template) {
        super()
        this.template = template
        this.lifecycles = []
    }
    
    render(): Place {
        const renderer = new Renderer(this, this.place, this.lifecycles)
        renderer.renderTemplate(this.template)
        return renderer.lastPlace;
    }

    mount() {
        for (const c of this.lifecycles) {
            if (c.mount) {
                c.mount()
            }
        }
    }

    unmount() {
        for (const c of this.lifecycles) {
            if (c.unmount) {
                c.unmount()
            }
        }
        this.lifecycles.length = 0
    }
}

interface EventHandlersMap {
    [key: string]: EventListenerOrEventListenerObject
}

class EventHandlerController<E extends Element = Element> implements Lifecycle {
    element: E
    eventsMap: EventHandlersMap
    constructor(element: E, eventsMap: EventHandlersMap) {
        this.element = element
        this.eventsMap = eventsMap
    }

    mount() {
        for (const [eventName, handler] of Object.entries(this.eventsMap)) {
            this.element.addEventListener(eventName, handler)
        }
    }

    unmount() {
        for (const [eventName, handler] of Object.entries(this.eventsMap)) {
            this.element.removeEventListener(eventName, handler)
        }
    }
}

export class TemplateRef<T extends Element | Component> {
    _element: T | ((renderer: Renderer) => T)
    constructor(element: (renderer: Renderer) => T) {
        this._element = element
    }

    get element(): T {
        if (typeof this._element === 'function') {
            throw new Error("Invalid usage of TemplateRef, element is not rendered")
        }
        return this._element
    }

    render(renderer: Renderer): T {
        if (typeof this._element === 'function') {
            this._element = this._element(renderer)
        }
        return this._element
    }
}

export const el = (tag: string, attrs: ElementAttrsMap | null = null, on: EventHandlersMap | null = null) => {
    return (...children: Template[]) => (renderer: Renderer) => {
        const element = dce(tag, attrs)
        if (on) {
            renderer.pushLifecycle(new EventHandlerController(element, on))
        }
        
        renderer.renderElement(element, children);
        return element
    }
}

export const ref = <T extends Element | Component>(renderFunc: ComponentFunction<T>) => new TemplateRef<T>(renderFunc)

export const fr = (...children: Template[]) => {
    return new TemplateComponent(children);
};
