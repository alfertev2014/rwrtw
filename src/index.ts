
class Controller {
    controllers: Controller[]
    mounted: boolean
    constructor(controllers: Controller[]) {
        this.controllers = controllers
        this.mounted = false
    }

    mount() {
        if (! this.mounted) {
            for (const c of this.controllers) {
                c.mount()
            }
            this.mounted = true
            this.onMount()
        }
    }

    unmount() {
        if (this.mounted) {
            this.onUnmount()
            this.mounted = false
            for (const c of this.controllers) {
                c.unmount()
            }
            this.controllers.length = 0
        }
    }

    onMount() {}

    onUnmount() {}
}

type DOMPlace = Node | { parent: Node }

type Place = DOMPlace | ComponentController

const renderNode = (node: Node, place: Place) => {
    if (place instanceof Node) {
        place.parentNode?.insertBefore(node, place.nextSibling)
    } else if (place instanceof ComponentController) {
        const domPlace = place.lastNode
        if (domPlace instanceof Node) {
            domPlace.parentNode?.insertBefore(node, domPlace.nextSibling)
        } else {
            domPlace.parent.appendChild(node)
        }
    } else {
        place.parent.appendChild(node)
    }
}

type Rendered = { controllers: Controller[], lastPlace: Place }

class Component {
    constructor() {
        
    }

    render(place: Place): ComponentController | Rendered {
        throw new Error("Method not implemented.")
    }
}

type TemplateElement = Component | boolean | string | number | null | undefined

type Template = TemplateElement | TemplateElement[]

const renderTemplate = (template: Template, place: Place): Rendered => {

    const controllers: Controller[] = []
    
    let currentPlace: Place = place

    for (const child of Array.isArray(template) ? template : [template]) {
        if (typeof child === 'boolean' || child === null || typeof child === 'undefined') {
            continue;
        }
        
        if (typeof child === 'string' || typeof child === 'number') {
            const node = document.createTextNode(String(child))
            renderNode(node, currentPlace)
            currentPlace = node
        } else if (child instanceof Component) {
            const rendered = child.render(currentPlace)
            if (rendered instanceof ComponentController) { 
                controllers.push(rendered)
                currentPlace = rendered
            } else {
                controllers.push(...rendered.controllers)
                currentPlace = rendered.lastPlace
            }
        }
    }

    return { controllers, lastPlace: currentPlace }
}

class ComponentController extends Controller {
    place: Place
    lastPlace: Place
    constructor(place: Place, children: Template) {
        const { controllers, lastPlace } = renderTemplate(children, place)
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

class ElementComponent extends Component {
    tag: string
    props: object | null
    children: Template
    constructor(tag: string, props: object | null, children: Template) {
        super()
        this.tag = tag
        this.props = props
        this.children = children
    }

    render(place: Place) {
        const element = document.createElement(this.tag)
        const { controllers } = renderTemplate(this.children, { parent: element })

        if (this.props && typeof this.props === 'object') {
            Object.entries(this.props).forEach(([key, val]) => {
                if (val !== false) {
                    // TODO: adapt key for html attribute
                    element.setAttribute(key, val === true ? "" : val)
                }
            })
        }

        renderNode(element, place)

        return { controllers, lastPlace: element }
    }
}

class TemplateComponent extends Component {

    template(): Template {
        return null
    }

    render(place: Place) {

        const template = this.template()

        return new ComponentController(place, template)
    }
}

class FragmentComponent extends TemplateComponent {
    children: TemplateElement[]
    constructor(...children: TemplateElement[]) {
        super()
        this.children = children
    }

    template() {
        return this.children
    }
}

const el = (tag: string, props: object | null, ...children: TemplateElement[]) => {
    return new ElementComponent(tag, props, children);
}

const fr = (...children: TemplateElement[]) => {
    return new FragmentComponent(...children)
}

