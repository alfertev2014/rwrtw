
type DOMPlace = Node | { parent: Node }

type Place = DOMPlace | Controller

type ContentElement = Controller | Node

class Controller {
    place: Place
    dom: Node[]
    children: ContentElement[]
    mounted: boolean
    constructor(place: Place, dom: Node[], children: ContentElement[]) {
        this.place = place
        this.dom = dom
        this.children = children
        this.mounted = false
    }

    get lastNode(): DOMPlace {
        if (this.children.length > 0) {
            const last = this.children[this.children.length - 1]
            if (last instanceof Node) {
                return last
            }
            return last.lastNode
        } else if (this.place instanceof Controller) {
            return this.place.lastNode
        } else {
            return this.place
        }
    }

    mount() {
        if (! this.mounted) {
            for (const c of this.children) {
                if (c instanceof Controller) {
                    c.mount()
                }
            }
            this.mounted = true
            this.onMount()
        }
    }

    unmount() {
        if (this.mounted) {
            this.onUnmount()
            this.mounted = false
            for (const c of this.children) {
                if (c instanceof Controller) {
                    c.unmount()
                }
            }
            this.children.length = 0
        }
    }

    onMount() {}

    onUnmount() {}
}

class Component {
    constructor() {
        
    }

    render(place: Place): Controller {
        throw new Error("Method not implemented.")
    }
}


type TemplateElement = Component | boolean | string | number | null | undefined

type Template = TemplateElement | TemplateElement[]

const renderTemplate = (template: Template, place: Place): ContentElement[] => {

    const controllers: ContentElement[] = []
    
    let currentPlace: Place = place

    for (const child of Array.isArray(template) ? template : [template]) {
        if (typeof child === 'boolean' || child === null || typeof child === 'undefined') {
            continue;
        }
        
        if (typeof child === 'string' || typeof child === 'number') {
            const node = document.createTextNode(String(child))
            controllers.push(node)
            currentPlace = node
        } else if (child instanceof HTMLElement) {
            controllers.push(child)
            currentPlace = child
        } else if (child instanceof Component) {
            const controller = child.render(currentPlace)
            controllers.push(controller)
            currentPlace = controller
        }
    }

    return controllers
}

class ElementComponent extends Component {
    tag: string
    props: object | null
    children: TemplateElement[]
    constructor(tag: string, props: object | null, ...children: TemplateElement[]) {
        super()
        this.tag = tag
        this.props = props
        this.children = children
    }

    render(place: Place) {
        const element = document.createElement(this.tag)
        const renderedChildren = renderTemplate(this.children, { parent: element })

        if (this.props && typeof this.props === 'object') {
            Object.entries(this.props).forEach(([key, val]) => {
                if (val !== false) {
                    // TODO: adapt key for html attribute
                    element.setAttribute(key, val === true ? "" : val)
                }
            })
        }

        if (place instanceof Node) {
            place.parentNode?.insertBefore(element, place.nextSibling)
        } else if (place instanceof Controller) {
            const domPlace = place.lastNode
            if (domPlace instanceof Node) {
                domPlace.parentNode?.insertBefore(element, domPlace.nextSibling)
            } else {
                domPlace.parent.appendChild(element)
            }
        } else {
            place.parent.appendChild(element)
        }

        return new Controller(place, [element], renderedChildren)
    }
}

class TemplateComponent extends Component {

    template(): Template {
        return null
    }

    render(place: Place) {

        const template = this.template()

        return new Controller(place, [], renderTemplate(template, place))
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
    return new ElementComponent(tag, props, ...children);
}

const fr = (...children: TemplateElement[]) => {
    return new FragmentComponent(...children)
}

