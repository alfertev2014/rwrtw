import { dce, txt } from './dom'

export interface Lifecycle {
    readonly mount?: () => void
    readonly unmount?: () => void
}

export interface Renderer {
    readonly place: Place // TODO: Hide this from public API
    renderText(text: string): void
    renderDomNode(node: Node): void
    renderElement(tag: string, childrenFunc?: ComponentFactory): HTMLElement
    addLifecycle(lifecycle: Lifecycle | null | undefined): void
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

    renderElement(tag: string, childrenFunc?: ComponentFactory): HTMLElement {
        const element = dce(tag)
        const rendered = renderNode(this.place, element)
        this.place = { type: PlaceType.Node, node: rendered }
        if (childrenFunc) {
            childrenFunc(
                new RendererImpl({ type: PlaceType.ParentNode, parent: element }, this.parent)
            )
        }
        return element
    }

    addLifecycle(lifecycle: Lifecycle | null | undefined) {
        if (lifecycle) {
            this.parent.addLifecycle(lifecycle)
        }
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

    moveToPlace(place: Place) {
        const fragment = takeNodes(this.place, this.lastPlace)
        this.place = place
        renderNode(this.place, fragment)
    }
}

export const createRootPlaceholder = (element: Element): Placeholder =>
    new PlaceholderImpl({ type: PlaceType.ParentNode, parent: element })

export const plh =
    (componentFunc: ComponentFactory | null = null): ComponentFactory<Placeholder> =>
    (renderer: Renderer) => {
        const p = new PlaceholderImpl(renderer.place)
        renderer.addLifecycle(p)
        p.renderContent(componentFunc)
        return p
    }

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

interface List extends Lifecycle {
    get lastPlace(): Place
    insert<T>(index: number, componentFunc: ComponentFactory<T>): void
    removeAt(index: number): void
}

class ListImpl implements List {
    place: Place
    elements: PlaceholderImpl[]
    constructor(place: Place, componentFuncs: ComponentFactory[]) {
        this.place = place
        this.elements = []
        let index = 0
        for (const componentFunc of componentFuncs) {
            const placeholder = new PlaceholderImpl(
                index > 0
                    ? {
                          type: PlaceType.Placeholder,
                          placeholder: this.elements[index - 1],
                      }
                    : this.place
            )
            placeholder.renderContent(componentFunc)
            ++index
            this.elements.push(placeholder)
        }
    }

    get lastPlace(): Place {
        if (this.elements.length > 0) {
            return {
                type: PlaceType.Placeholder,
                placeholder: this.elements[this.elements.length - 1],
            }
        } else {
            return this.place
        }
    }

    insert<T>(index: number, componentFunc: ComponentFactory<T>) {
        if (index > this.elements.length) {
            index = this.elements.length
        }
        const placeholder = new PlaceholderImpl(
            index > 0
                ? {
                      type: PlaceType.Placeholder,
                      placeholder: this.elements[index - 1],
                  }
                : this.place
        )
        if (index < this.elements.length) {
            this.elements[index].place = { type: PlaceType.Placeholder, placeholder }
        }
        this.elements.splice(index, 0, placeholder)
        placeholder.setContent(componentFunc)
    }

    removeAt(index: number) {
        if (index >= this.elements.length) {
            return
        }
        if (index > 0 && index < this.elements.length - 1) {
            this.elements[index + 1].place = {
                type: PlaceType.Placeholder,
                placeholder: this.elements[index - 1],
            }
        }
        this.elements[index].setContent(null)
        this.elements.splice(index, 1)
    }

    moveFromTo(fromIndex: number, toIndex: number) {
        if (fromIndex === toIndex) {
            return
        }
        const placeholder = this.elements[fromIndex]

        if (fromIndex < toIndex) {
            for (let i = fromIndex; i < toIndex - 1; ++i) {
                this.elements[i] = this.elements[i + 1]
            }
        } else {
            for (let i = fromIndex; i > toIndex + 1; --i) {
                this.elements[i] = this.elements[i - 1]
            }
        }
        this.elements[toIndex] = placeholder

        placeholder.moveToPlace(
            toIndex === 0
                ? this.place
                : { type: PlaceType.Placeholder, placeholder: this.elements[toIndex - 1] }
        )
        if (toIndex < this.elements.length - 1) {
            this.elements[toIndex + 1].place = { type: PlaceType.Placeholder, placeholder }
        }
    }

    mount() {
        for (const element of this.elements) {
            element.mount()
        }
    }

    unmount() {
        for (const element of this.elements) {
            element.unmount()
        }
    }
}

export const list =
    (...componentFuncs: ComponentFactory[]): ComponentFactory<List> =>
    (renderer: Renderer) => {
        const l = new ListImpl(renderer.place, componentFuncs)
        renderer.addLifecycle(l)
        return l
    }
