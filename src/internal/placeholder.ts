import { dce, setAttr, txt } from '../dom'
import { Lifecycle } from '../lifecycle'
import { RenderedContent, RenderedElement, RenderedPlaceholder } from '../template'
import { ListImpl } from './list'
import { DOMPlace, ParentNodePlace, ParentPlaceholderPlace, Place, PlaceholderNode, renderNode, takeNodes, unrenderNodes } from './place'

export interface Placeholder {
    setContent(content: RenderedContent): void
}

const renderElement = ({ tag, attrs, handlers, children }: RenderedElement, lifecycles: Lifecycle[]): Place => {
    const element = dce(tag)

    processRendered(new ParentNodePlace(element), lifecycles, children)

    if (attrs) {
        for (const [name, value] of Object.entries(attrs)) {
            if (typeof value === 'function') {
                const lifecycle = value(element, name)
                if (lifecycle) {
                    lifecycles.push(lifecycle)
                }
            } else {
                setAttr(element, name, value)
            }
        }
    }
    for (const handler of handlers) {
        const lifecycle = handler(element)
        if (lifecycle) {
            lifecycles.push(lifecycle)
        }
    }
    return element
}

const processRendered = (place: Place, lifecycles: Lifecycle[], rendered: RenderedContent): Place => {
    if (typeof rendered === 'boolean' || rendered === null || typeof rendered === 'undefined') {
        return place
    }
    if (typeof rendered === 'string') {
        place = renderNode(place, txt(rendered))
    } else if (typeof rendered === 'number') {
        place = renderNode(place, txt(rendered.toString()))
    } else if (Array.isArray(rendered)) {
        for (const r of rendered) {
            place = processRendered(place, lifecycles, r)
        }
    } else if (rendered.type === 'element') {
        place = renderElement(rendered, lifecycles)
    } else if (rendered.type === 'text') {
        place = renderNode(place, txt(rendered.data))
    } else if (rendered.type === 'placeholder') {
        const plh = new PlaceholderImpl(place, rendered.content)
        lifecycles.push(plh)
        rendered.handler?.(plh)
        place = plh
    } else if (rendered.type === 'list') {
        const list = new ListImpl(place, rendered.contents)
        lifecycles.push(list)
        rendered.handler?.(list)
        place = list
    } else if (rendered.type === 'component') {
        place = processRendered(place, lifecycles, rendered.factory(...rendered.args))
    } else if (rendered.type === 'lifecycle') {
        lifecycles.push(rendered)
    }
    return place
}

export class PlaceholderImpl extends PlaceholderNode implements Lifecycle {
    lifecycles: Lifecycle[]
    place: Place
    lastPlace: Place
    constructor(place: Place, content: RenderedContent | null) {
        super()
        this.lifecycles = []
        this.place = place
        this.lastPlace = place
        this.renderContent(content)
    }

    lastPlaceNode(): DOMPlace {
        if (this.lastPlace instanceof PlaceholderNode) {
            return this.lastPlace.lastPlaceNode()
        }
        return this.lastPlace
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

    renderContent(content: RenderedContent | null = null) {
        if (content) {
            this.lastPlace = processRendered(new ParentPlaceholderPlace(this), this.lifecycles, content)
        }
    }

    setContent(content: RenderedContent | null = null) {
        this.unmount()
        unrenderNodes(this.place, this.lastPlace)
        this.lastPlace = this.place
        this.renderContent(content)
        this.mount()
    }

    spawnBefore(content: RenderedContent | null = null): Placeholder {
        const spawned = new PlaceholderImpl(this.place, content)
        this.place = spawned
        return spawned
    }

    spawnAfter(content: RenderedContent | null = null): Placeholder {
        const spawned = new PlaceholderImpl(this.place, null)
        spawned.lifecycles = this.lifecycles
        spawned.lastPlace = this.lastPlace
        this.place = spawned
        this.lastPlace = this.place
        this.lifecycles = []
        this.renderContent(content)
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

export const plh = (content: RenderedContent, handler?: (placeholder: PlaceholderImpl) => void): RenderedPlaceholder => ({
    type: 'placeholder',
    content,
    handler,
})

export const createRootPlaceholder = (element: Element): Placeholder =>
    new PlaceholderImpl(new ParentNodePlace(element), null)

