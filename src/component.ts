import { dce, ElementAttrsMap, txt } from './dom'

export interface Lifecycle {
    readonly mount?: () => void
    readonly unmount?: () => void
}

export interface Renderer {
    renderText(text: string): void
    renderDomNode(node: Node): void
    renderElement(
        tag: string,
        attrs: ElementAttrsMap | null
    ): { element: HTMLElement; subrenderer: Renderer }
    renderPlaceholder(componentFunc?: ComponentFactory | null): Placeholder
    addLifecycle(lifecycle: Lifecycle): void
}

class Lifecycles implements Lifecycle {
    lifecycles: Lifecycle[]
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
        const node = renderNode(this.place, txt(text))
        this.place = { type: PlaceType.Node, node }
    }

    renderDomNode(node: Node) {
        const rendered = renderNode(this.place, node)
        this.place = { type: PlaceType.Node, node: rendered }
    }

    renderElement(
        tag: string,
        attrs: ElementAttrsMap | null = null
    ): { element: HTMLElement; subrenderer: Renderer } {
        const element = dce(tag, attrs)
        const rendered = renderNode(this.place, element)
        this.place = { type: PlaceType.Node, node: rendered }
        return {
            element,
            subrenderer: new RendererImpl(
                { type: PlaceType.ParentNode, parent: element },
                this.parent
            ),
        }
    }

    renderPlaceholder(componentFunc: ComponentFactory | null = null): Placeholder {
        const p = new PlaceholderImpl(this.place)
        this.addLifecycle(p)
        p.renderContent(componentFunc)
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
    setContent<T>(componentFunc: ComponentFactory<T> | null): void
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
            const renderer = new RendererImpl(
                { type: PlaceType.ParentPlaceholder, parent: this },
                this
            )
            componentFunc(renderer)
            this.lastPlace = renderer.place
        }
    }

    setContent<T>(componentFunc: ComponentFactory<T> | null = null) {
        this.unmount()
        unrenderNodes(this.place, this.lastPlace)
        this.lastPlace = this.place
        this.renderContent(componentFunc)
        this.mount()
    }

    spawnBefore<T>(componentFunc: ComponentFactory<T> | null = null): Placeholder {
        const spawned = new PlaceholderImpl(this.place)
        spawned.renderContent(componentFunc)
        this.place = { type: PlaceType.Placeholder, placeholder: spawned }
        return spawned
    }

    spawnAfter<T>(componentFunc: ComponentFactory<T> | null = null): Placeholder {
        const spawned = new PlaceholderImpl(this.place)
        spawned.lifecycles = this.lifecycles
        spawned.lastPlace = this.lastPlace
        this.place = { type: PlaceType.Placeholder, placeholder: spawned }
        this.lastPlace = this.place
        this.lifecycles = []
        this.renderContent(componentFunc)
        return spawned
    }

    swapWith(placeholder: PlaceholderImpl) {
        const thisFragment = takeNodes(this.place, this.lastPlace)
        const otherFragment = takeNodes(placeholder.place, placeholder.lastPlace)
        const lifecycles = this.lifecycles
        const place = this.place
        const lastPlace = this.lastPlace
        this.lifecycles = placeholder.lifecycles
        this.place = placeholder.place
        this.lastPlace = placeholder.lastPlace
        placeholder.lifecycles = lifecycles
        placeholder.place = place
        placeholder.lastPlace = lastPlace
        renderNode(this.place, thisFragment)
        renderNode(placeholder.place, otherFragment)
    }
}

export const createRootPlaceholder = (element: Element): Placeholder =>
    new PlaceholderImpl({ type: PlaceType.ParentNode, parent: element })

export const plh =
    (componentFunc: ComponentFactory | null = null): ComponentFactory<Placeholder> =>
    (renderer: Renderer) =>
        renderer.renderPlaceholder(componentFunc)

enum PlaceType {
    Node,
    ParentNode,
    Placeholder,
    ParentPlaceholder,
}

type DOMPlace = { type: PlaceType.Node; node: Node } | { type: PlaceType.ParentNode; parent: Node }

type Place =
    | DOMPlace
    | { type: PlaceType.Placeholder; placeholder: PlaceholderImpl }
    | { type: PlaceType.ParentPlaceholder; parent: PlaceholderImpl }

const lastPlaceNode = (place: Place): DOMPlace => {
    switch (place.type) {
        case PlaceType.Placeholder:
            return lastPlaceNode(place.placeholder.lastPlace)
        case PlaceType.ParentPlaceholder:
            return lastPlaceNode(place.parent.place)
        default:
            return place
    }
}

const renderNode = <T extends Node>(place: Place, node: T): T => {
    const domPlace = lastPlaceNode(place)
    if (domPlace.type === PlaceType.Node) {
        const domNode = domPlace.node
        if (domNode.parentNode) {
            return domNode.parentNode.insertBefore(node, domNode.nextSibling)
        } else {
            return node
        }
    } else {
        return domPlace.parent.appendChild(node)
    }
}

const unrenderNodes = (place: Place, lastPlace: Place) => {
    const lastDomPlace: DOMPlace | null = lastPlaceNode(lastPlace)
    if (lastDomPlace && lastDomPlace.type === PlaceType.Node) {
        let lastDomNode: Node | null = lastDomPlace.node
        const firstDomPlace = place ? lastPlaceNode(place) : null
        const firstDomNode = firstDomPlace?.type === PlaceType.Node ? firstDomPlace.node : null
        while (lastDomNode && lastDomNode !== firstDomNode) {
            const toRemove = lastDomNode
            lastDomNode = lastDomNode.previousSibling
            toRemove.parentNode?.removeChild(toRemove)
        }
    }
}

const takeNodes = (place: Place, lastPlace: Place): DocumentFragment => {
    const lastDomPlace: DOMPlace | null = lastPlaceNode(lastPlace)
    const fragment = document.createDocumentFragment()
    if (lastDomPlace && lastDomPlace.type === PlaceType.Node) {
        let lastDomNode: Node | null = lastDomPlace.node
        const firstDomPlace = place ? lastPlaceNode(place) : null
        const firstDomNode = firstDomPlace?.type === PlaceType.Node ? firstDomPlace.node : null
        while (lastDomNode && lastDomNode !== firstDomNode) {
            const toRemove = lastDomNode
            lastDomNode = lastDomNode.previousSibling
            if (toRemove.parentNode) {
                fragment.prepend(toRemove.parentNode.removeChild(toRemove))
            }
        }
    }
    return fragment
}
