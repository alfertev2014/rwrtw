import { txt } from './dom'

export interface Lifecycle {
    readonly mount?: () => void
    readonly unmount?: () => void
}

export interface Renderer {
    renderText(text: string): void;
    renderDomNode(node: Node): void;
    renderElement(element: Element): Renderer;
    renderPlaceholder(componentFunc?: ComponentFactory | null): Placeholder;
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

    renderPlaceholder(componentFunc: ComponentFactory | null = null): Placeholder {
        const p = new PlaceholderImpl(this.place)
        this.addLifecycle(p)
        p.renderContent(componentFunc);
        return p
    }

    addLifecycle(lifecycle: Lifecycle) {
        this.parent.addLifecycle(lifecycle)
    }
}

export interface ComponentFactory<T = unknown> {
    (renderer: Renderer): T
}

export interface Placeholder {
    setContent<T>(componentFunc: ComponentFactory<T> | null): void;
}

class PlaceholderImpl extends Lifecycles {
    place: Place
    lastPlace: Place
    constructor(place: Place) {
        super()
        this.place = place
        this.lastPlace = place
    }

    renderContent<T>(componentFunc: ComponentFactory<T> | null = null) {
        if (componentFunc) {
            const renderer = new RendererImpl(this.place, this)
            componentFunc(renderer)
            this.lastPlace = renderer.place
        }
    }

    spawnBefore(): Placeholder {
        const spawned = new PlaceholderImpl(this.place)
        this.place = spawned
        return spawned
    }

    setContent<T>(componentFunc: ComponentFactory<T> | null = null) {
        this.unmount()
        unrenderNodes(this.place, this.lastPlace)
        this.lastPlace = this.place
        this.renderContent(componentFunc)
        this.mount()
    }
}

export const createRootPlaceholder = (element: Element): Placeholder =>
    new PlaceholderImpl({ parent: element })

export const plh =
    (componentFunc: ComponentFactory | null = null): ComponentFactory<Placeholder> =>
    (renderer: Renderer) => renderer.renderPlaceholder(componentFunc)


type DOMPlace = Node | { parent: Node }

type Place = DOMPlace | PlaceholderImpl

const lastPlaceNode = (place: Place): DOMPlace => {
    if (place instanceof PlaceholderImpl) {
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