
class Controller {
    mounted: boolean
    constructor() {
        this.mounted = false
    }

    mount() {
        if (! this.mounted) {
            this.onMounting()
            this.mounted = true
            this.onMounted()
        }
    }

    unmount() {
        if (this.mounted) {
            this.onUnmounting()
            this.mounted = false
            this.onUnmounted()
        }
    }

    onMounting() {}
    onMounted() {}

    onUnmounting() {}
    onUnmounted() {}
}

class Component extends Controller {
    controllers: Controller[] | null
    constructor(controllers: Controller[] | null = null) {
        super()
        this.controllers = controllers
    }

    onMounting() {
        if (this.controllers) {
            for (const c of this.controllers) {
                c.mount()
            }
        }
    }

    onUnmounted() {
        if (this.controllers) {
            for (const c of this.controllers) {
                c.unmount()
            }
            this.controllers = null
        }
    }

    render(place: Place) {
        throw Error("Not implemented")
    }

    get lastNode(): DOMPlace {
        throw Error("Not implemented")
    }
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

type TemplateElement = Component | boolean | string | number | null | undefined

type Template = TemplateElement | Template[]

const insertNode = (node: Node, place: Place) => {
    const domPlace = lastPlaceNode(place)
    if (domPlace instanceof Node) {
        domPlace.parentNode?.insertBefore(node, domPlace.nextSibling)
    } else {
        domPlace.parent.appendChild(node)
    }
}

const renderTemplate = (place: Place, template: Template) => {
    const controllers: Controller[] = []
    
    let currentPlace: Place = place

    if (typeof template === 'boolean' || template === null || typeof template === 'undefined') {
      return { controllers: [], lastPlace: place }
    }
    
    if (typeof template === 'string' || typeof template === 'number') {
        const node = document.createTextNode(String(template))
        insertNode(node, currentPlace)
        currentPlace = node
    } else if (template instanceof Component) {
        template.render(currentPlace)
        controllers.push(template)
        currentPlace = template
    } else if (Array.isArray(template)) {
        for (const child of template) {
            const { controllers: subcontrollers, lastPlace } = renderTemplate(currentPlace, child)
            controllers.push(...subcontrollers)
            currentPlace = lastPlace
        }
    }

    return { controllers, lastPlace: currentPlace }
}

const unrenderNodes = (place: Place, lastNode: DOMPlace) => {
    let domPlace: DOMPlace | null = lastNode
    if (domPlace instanceof Node) {
        const firstDomPlace = lastPlaceNode(place)
        const firstNode = firstDomPlace instanceof Node ? firstDomPlace : null;
        while (domPlace && domPlace !== firstNode) {
            const toRemove = domPlace
            domPlace = domPlace.previousSibling
            toRemove.parentNode?.removeChild(toRemove)
        }
    }
}

class Placeholder extends Component {
    place: Place | null
    lastPlace: Place | null
    constructor() {
        super()
        this.place = null
        this.lastPlace = null
    }
    
    render(place: Place) {
        this.place = place
        this.lastPlace = place
    }

    get lastNode(): DOMPlace {
        if (! this.lastPlace) {
            throw Error("lastNode of unrendered template")
        }
        return lastPlaceNode(this.lastPlace)
    }

    setContent(template: Template) {
        if (! this.place) {
            throw Error("setContent of unrendered template")
        }
        this.unmount()
        unrenderNodes(this.place, this.lastNode)
        
        const { controllers, lastPlace } = renderTemplate(this.place, template)
        this.controllers = controllers
        this.lastPlace = lastPlace

        this.mount()
    }
}

class EventHandlerController<E extends Element = Element> extends Controller {
    element: E
    eventName: string
    handler: EventListenerOrEventListenerObject
    constructor(element: E, eventName: string, handler: EventListenerOrEventListenerObject) {
        super()
        this.element = element
        this.eventName = eventName
        this.handler = handler
    }

    onMounted() {
        this.element.addEventListener(this.eventName, this.handler)
    }

    onUnmounting() {
        this.element.removeEventListener(this.eventName, this.handler)
    }
}

type ElementAttrValue = number | string | boolean | null | undefined

interface EventHandlersMap {
    [key: string]: EventListenerOrEventListenerObject
}

type EventHandlersConfig = {
    on: EventHandlersMap
}

interface ElementAttrsMap {
    [key: string]: ElementAttrValue
}

type ElementAttrsConfig = {
    attrs: ElementAttrsMap
}

interface ElementProcessor {
    (element: HTMLElement): void
}

type ElementConfig = EventHandlersConfig | ElementAttrsConfig | ElementProcessor

export class ElementComponent extends Component {
    element: HTMLElement
    constructor(tag: string, props: ElementConfig[], children: Template) {
        const element = document.createElement(tag)
        const { controllers } = renderTemplate({ parent: element }, children);

        for (const prop of props) {
            if ('on' in prop) {
                for (const [type, listener] of Object.entries(prop.on)) {
                    controllers.push(new EventHandlerController(element, type, listener))
                }
            } else if ('attrs' in prop) {
                for (const [name, value] of Object.entries(prop.attrs)) {
                    if (value) {
                        element.setAttribute(name, value === true ? '' : value.toString());
                    }
                }
            } else {
                prop(element)
            }
        }
        
        super(controllers)
        this.element = element
    }

    render(place: Place) {
        insertNode(this.element, place)
    }

    get lastNode() {
        return this.element
    }
}

export const el = (tag: string, ...props: ElementConfig[]) => (...children: Template[]) => {
    return new ElementComponent(tag, props, children);
}

export const plh = (place: DOMPlace) => {
    const res = new Placeholder()
    res.render(place)
    res.mount()
    return res
}
