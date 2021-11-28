
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

class Component {
    constructor() {
        
    }

    render(place: Place): ComponentController {
        throw new Error("Method not implemented.")
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
        if (this.lastPlace instanceof ComponentController) {
            return this.lastPlace.lastNode
        } else {
            return this.lastPlace
        }
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

type ElementPropValue = number | string | boolean | null | undefined

type EventHandlersProps = {
    on?: {
        [key: string]: EventListenerOrEventListenerObject
    }
}

type ElementProps = {
    [key: string]: ElementPropValue,
} & EventHandlersProps

class EventHandlerController extends Controller {
    element: Element
    eventName: string
    handler: EventListenerOrEventListenerObject
    constructor(element: Element, eventName: string, handler: EventListenerOrEventListenerObject) {
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

class ElementComponent extends Component {
    tag: string
    props: ElementProps | null
    children: Template
    constructor(tag: string, props: ElementProps | null, children: Template) {
        super()
        this.tag = tag
        this.props = props
        this.children = children
    }

    render(place: Place) {
        const element = document.createElement(this.tag)
        const childrenController = new TemplateController({ parent: element }, this.children)
        const controllers: Controller[] = [childrenController];

        if (this.props && typeof this.props === 'object') {
            if (this.props.on && typeof this.props.on === 'object') {
                Object.entries(this.props.on).forEach(([eventName, handler]) => {
                    controllers.push(new EventHandlerController(element, eventName, handler))
                })
            }
            Object.entries(this.props).forEach(([key, val]) => {
                if (key !== 'on' && typeof val !== 'object'
                && val !== null && val !== undefined && val !== false) {
                    // TODO: adapt key for html attribute
                    element.setAttribute(key, val === true ? "" : val.toString())
                }
            })
        }

        insertNode(element, place)

        return new ComponentController(place, controllers, element);
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

export const el = (tag: string, props: ElementProps | null = null) => (...children: TemplateElement[]) => {
    return new ElementComponent(tag, props, children);
}

export const fr = (...children: TemplateElement[]) => {
    return new TemplateComponent(children)
}

