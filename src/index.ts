
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

class ParentController extends Controller {
    controllers: Controller[]
    constructor(controllers: Controller[]) {
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
        this.controllers.length = 0
    }
}

type DOMPlace = Node | { parent: Node }

type Place = DOMPlace | ComponentController

const lastPlaceNode = (place: Place) => {
    if (place instanceof ComponentController) {
        return place.lastNode
    } else {
        return place
    }
}

class ComponentController extends ParentController {
    place: Place
    lastPlace: Place
    constructor(place: Place, controllers: Controller[], lastPlace: Place) {
        super(controllers)
        this.place = place
        this.lastPlace = lastPlace
    }
    
    get lastNode(): DOMPlace {
        return lastPlaceNode(this.lastPlace)
    }

    unrender() {
        if (this.mounted) {
            this.unmount()
        }
        
        let domPlace: DOMPlace | null = this.lastNode
        if (domPlace instanceof Node) {
            const firstDomPlace = lastPlaceNode(this.place)
            const firstNode = firstDomPlace instanceof Node ? firstDomPlace : null;
            while (domPlace && domPlace !== firstNode) {
                const toRemove = domPlace
                domPlace = domPlace.previousSibling
                toRemove.parentNode?.removeChild(toRemove)
            }
        }
    }
}

class Component {
    constructor() {
        
    }

    render(place: Place): ComponentController {
        throw new Error("Method not implemented.")
    }
}

type TemplateElement = Component | boolean | string | number | null | undefined

type Template = TemplateElement | Template[]

const insertNode = (node: Node, place: Place) => {
    if (place instanceof Node) {
        place.parentNode?.insertBefore(node, place.nextSibling)
    } else if (place instanceof ComponentController) {
        insertNode(node, place.lastNode)
    } else {
        place.parent.appendChild(node)
    }
}

class TemplateController extends ComponentController {
    constructor(place: Place, template: Template) {
        const controllers: Controller[] = []
    
        let currentPlace: Place = place

        for (const child of Array.isArray(template) ? template : [template]) {
            if (typeof child === 'boolean' || child === null || typeof child === 'undefined') {
                continue;
            }
            
            if (typeof child === 'string' || typeof child === 'number') {
                const node = document.createTextNode(String(child))
                insertNode(node, currentPlace)
                currentPlace = node
            } else if (child instanceof Component) {
                const rendered = child.render(currentPlace)
                controllers.push(rendered)
                currentPlace = rendered
            } else if (Array.isArray(child)) {
                const subtemplate = new TemplateController(currentPlace, child);
                controllers.push(subtemplate)
                currentPlace = subtemplate
            }
        }

        super(place, controllers, currentPlace)
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

    onUnmounted() {
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

export class ElementController extends ComponentController {
    element: HTMLElement
    constructor(place: Place, controllers: Controller[], element: HTMLElement) {
        super(place, controllers, element)
        this.element = element
    }
}

class ElementComponent extends Component {
    tag: string
    props: ElementConfig[]
    children: Template
    constructor(tag: string, props: ElementConfig[], children: Template) {
        super()
        this.tag = tag
        this.props = props
        this.children = children
    }

    render(place: Place) {
        const element = document.createElement(this.tag)
        const childrenController = new TemplateController({ parent: element }, this.children)
        const controllers: Controller[] = [childrenController];

        for (const prop of this.props) {
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

        insertNode(element, place)

        return new ElementController(place, controllers, element);
    }
}

class TemplateComponent extends Component {
    template: Template
    constructor(template: Template) {
        super()
        this.template = template
    }

    render(place: Place) {
        return new TemplateController(place, this.template)
    }
}

export const el = (tag: string, ...props: ElementConfig[]) => (...children: TemplateElement[]) => {
    return new ElementComponent(tag, props, children);
}

export const fr = (...children: TemplateElement[]) => {
    return new TemplateComponent(children)
}

