
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
    console.log(tag, attrs)
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


type DOMPlace = Node | { parent: Node }

type Place = DOMPlace | Component

const lastPlaceNode = (place: Place) => {
    if (place instanceof Component) {
        return place.lastNode
    } else {
        return place
    }
}


export interface Lifecycle {
    mount?: () => void
    unmount?: () => void
}

export abstract class Component implements Lifecycle {
    parent: Component | null
    place: Place
    lastPlace: Place

    get lastNode(): DOMPlace {
        return lastPlaceNode(this.lastPlace)
    }

    get isHidden() {
        return this.place && this.lastPlace === this.place
    }

    constructor(place: Place, parent: Component | null = null) {
        this.place = place
        this.lastPlace = place
        this.parent = parent
    }

    renderNodes() {
        if (this.isHidden) {
            this.lastPlace = this.render()
        }
    }

    abstract render(): Place
    abstract mount(): void
    abstract unmount(): void

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
        this.lastPlace = this.place
    }

    show() {
        if (this.isHidden) {
            this.renderNodes()
            this.mount()
        }
    }

    hide() {
        if (! this.isHidden) {
            this.unmount()
            this.unrenderNodes()
        }
    }
}

interface RenderFunction<T extends Component | Element = Component | Element> {
    (renderer: Renderer): T
}

type TemplateElement = RenderFunction | Lifecycle | Node | boolean | string | number | null | undefined

type Template = TemplateElement | Template[]

class Renderer {
    parent: Component | null
    lastPlace: Place
    lifecycles: Lifecycle[]
    constructor(place: Place, parent: Component | null = null, lifecycles: Lifecycle[] = []) {
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
            return lastInsertingNode
        }
    }

    pushLifecycle(lifecycle: Lifecycle) {
        this.lifecycles.push(lifecycle)
        return lifecycle
    }

    renderTemplate(template: Template): Node | Component | undefined {
        if (typeof template === 'boolean' || template === null || typeof template === 'undefined') {
            return;
        }
        if (typeof template === 'function') {
            return this.lastPlace = template(this)
        } else if (typeof template === 'string' || typeof template === 'number') {
            const node = document.createTextNode(String(template))
            return this.insertNode(node)
        } else if (template instanceof Node) {
            return this.insertNode(template)
        } else if (Array.isArray(template)) {
            for (const child of template) {
                this.renderTemplate(child)
            }
        } else if (typeof template === 'object') {
            this.pushLifecycle(template)
        }
    }

    renderElement(element: Element, children: Template) {
        this.insertNode(element)
        const renderer = new Renderer({ parent: element }, this.parent, this.lifecycles)
        renderer.renderTemplate(children)
    }

    renderComponent(component: Component) {
        this.lastPlace = component
        return component
    }
}

export const renderTemplate = (place: Place, template: TemplateElement) => {
    const renderer = new Renderer(place)
    const rendered = renderer.renderTemplate(template)
    console.log(rendered)
    if (rendered instanceof Component) {
        rendered.renderNodes()
        rendered.mount()
    }
    return rendered
}

class TemplateComponent extends Component {
    readonly template: Template
    lifecycles: Lifecycle[]
    constructor(template: Template, place: Place, parent: Component | null = null) {
        super(place, parent)
        this.template = template
        this.lifecycles = []
    }
    
    render(): Place {
        const renderer = new Renderer(this.place, this, this.lifecycles)
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

export const fr = (...children: Template[]) => (renderer: Renderer) => {
    return renderer.renderComponent(new TemplateComponent(children, renderer.lastPlace, renderer.parent))
};


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


export class TemplateRef<T extends Component | Element> {
    _current: T | null = null
    get current(): T {
        if (! this._current) {
            throw Error("Invalid usage of TemplateRef")
        }
        return this._current
    }
}

export const createRef = <T extends Component | Element>() => new TemplateRef<T>()

export const ref = <T extends Component | Element>(ref: TemplateRef<T>, renderFunc: RenderFunction<T>) => {
    return (renderer: Renderer) => {
        return ref._current = renderFunc(renderer)
    }
}

