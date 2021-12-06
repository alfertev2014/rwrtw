
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
    controllers: Controller[]
    constructor(controllers: Controller[] = []) {
        super()
        this.controllers = controllers
    }

    onMounting() {
        for (const c of this.controllers) {
            c.mount()
        }
    }

    onUnmounted() {
        for (const c of this.controllers) {
            c.unmount()
        }
        this.controllers = []
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

export class Placeholder extends Component {
    place: Place | null
    lastPlace: Place
    fragment: DocumentFragment | null
    constructor(template: Template) {
        const fragment = document.createDocumentFragment()
        const { controllers, lastPlace } = renderTemplate({ parent: fragment }, template)
        super(controllers)
        this.place = null
        this.lastPlace = lastPlace
        this.fragment = fragment
    }
    
    render(place: Place) {
        this.place = place
        if (this.fragment) {
            insertNode(this.fragment, place)
            this.fragment = null
        }
    }

    get lastNode(): DOMPlace {
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

interface EventHandlersMap {
    [key: string]: EventListenerOrEventListenerObject
}

class EventHandlerController<E extends Element = Element> extends Controller {
    element: E
    eventsMap: EventHandlersMap
    constructor(element: E, eventsMap: EventHandlersMap) {
        super()
        this.element = element
        this.eventsMap = eventsMap
    }

    onMounted() {
        for (const [eventName, handler] of Object.entries(this.eventsMap)) {
            this.element.addEventListener(eventName, handler)
        }
    }

    onUnmounting() {
        for (const [eventName, handler] of Object.entries(this.eventsMap)) {
            this.element.removeEventListener(eventName, handler)
        }
    }
}

type ElementAttrValue = number | string | boolean | null | undefined

interface ElementAttrsMap {
    [key: string]: ElementAttrValue
}


export class ElementComponent extends Component {
    element: HTMLElement
    constructor(tag: string, attrs: ElementAttrsMap | null, on: EventHandlersMap | null, children: Template) {
        const element = document.createElement(tag)
        const { controllers } = renderTemplate({ parent: element }, children);

        if (attrs) {
            for (const [name, value] of Object.entries(attrs)) {
                if (value) {
                    element.setAttribute(name, value === true ? '' : value.toString());
                }
            }
        }
        
        if (on) {
            controllers.push(new EventHandlerController(element, on))
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

export const el = (tag: string, attrs: ElementAttrsMap | null = null, on: EventHandlersMap | null = null) => (...children: Template[]) => {
    return new ElementComponent(tag, attrs, on, children);
}

export const plh = (...children: Template[]) => {
    return new Placeholder(children)
}
