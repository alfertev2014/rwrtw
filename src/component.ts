import { txt } from './dom'

export interface Lifecycle {
    readonly mount?: () => void
    readonly unmount?: () => void
}

export interface Renderer {
    renderText(text: string): void;
    renderDomNode(node: Node): void;
    renderElement(element: Element): Renderer;
    renderPlaceholder(): Placeholder;
    addLifecycle(lifecycle: Lifecycle): void;
}

class Lifecycles implements Lifecycle {
    readonly lifecycles: Lifecycle[]
    constructor() {
        this.lifecycles = []
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

    addLifecycle(lifecycle: Lifecycle) {
        this.lifecycles.push(lifecycle)
    }
}

class RendererImpl implements Renderer {
    place: Place
    parent: Lifecycles
    constructor(place: Place, parent: Lifecycles) {
        this.place = place
        this.parent = parent
    }

    renderText(text: string) {
        this.place = renderNode(this.place, txt(text))
    }

    renderDomNode(node: Node) {
        this.place = renderNode(this.place, node)
    }

    renderElement(element: Element): Renderer {
        const rendered = renderNode(this.place, element)
        this.place = rendered
        return new RendererImpl({ parent: element }, this.parent)
    }

    renderPlaceholder(): Placeholder {
        const p = new Placeholder(this.place)
        this.addLifecycle(p)
        return p
    }

    addLifecycle(lifecycle: Lifecycle) {
        this.parent.addLifecycle(lifecycle)
    }
}

export interface ComponentFactory<T = unknown> {
    (renderer: Renderer): T
}

export class Placeholder extends Lifecycles {
    place: Place
    lastPlace: Place
    constructor(place: Place) {
        super()
        this.place = place
        this.lastPlace = place
    }

    renderContent<T>(componentFunc: ComponentFactory<T> | null) {
        if (componentFunc) {
            const renderer = new RendererImpl(this.place, this)
            componentFunc(renderer)
            this.lastPlace = renderer.place
        }
    }

    spawnBefore(): Placeholder {
        const spawned = new Placeholder(this.place)
        this.place = spawned
        return spawned
    }

    setContent<T>(componentFunc: ComponentFactory<T> | null) {
        this.unmount()
        unrenderNodes(this.place, this.lastPlace)
        this.lastPlace = this.place
        this.renderContent(componentFunc)
        this.mount()
    }
}

export const plh =
    (componentFunc: ComponentFactory): ComponentFactory<Placeholder> =>
    (renderer: Renderer) => {
        const h = renderer.renderPlaceholder()
        h.renderContent(componentFunc)
        return h
    }


type DOMPlace = Node | { parent: Node }

type Place = DOMPlace | Placeholder

const lastPlaceNode = (place: Place): DOMPlace => {
    if (place instanceof Placeholder) {
        return lastPlaceNode(place.lastPlace)
    } else {
        return place
    }
}

const renderNode = <T extends Node>(place: Place, node: T): T => {
    const domPlace = lastPlaceNode(place)
    if (domPlace instanceof Node) {
        if (domPlace.parentNode) {
            return domPlace.parentNode.insertBefore(node, domPlace.nextSibling)
        } else {
            return node
        }
    } else {
        return domPlace.parent.appendChild(node)
    }
}

const unrenderNodes = (place: Place, lastPlace: Place) => {
    let domPlace: DOMPlace | null = lastPlaceNode(lastPlace)
    if (domPlace instanceof Node) {
        const firstDomPlace = place ? lastPlaceNode(place) : null
        const firstNode = firstDomPlace instanceof Node ? firstDomPlace : null
        while (domPlace && domPlace !== firstNode) {
            const toRemove = domPlace
            domPlace = domPlace.previousSibling
            toRemove.parentNode?.removeChild(toRemove)
        }
    }
}