import { Lifecycle } from './lifecycle'
import { RenderedContent } from '../template'

import {
    DOMPlace,
    ParentNodePlace,
    ParentPlaceholderPlace,
    Place,
    PlaceholderNode,
    renderNode,
    takeNodes,
    unrenderNodes,
} from './place'
import { processRendered } from './rendering'

export interface Placeholder {
    setContent(content: RenderedContent): void
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
            this.lastPlace = processRendered(
                new ParentPlaceholderPlace(this),
                this.lifecycles,
                content,
            )
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

export const createRootPlaceholder = (element: Element): Placeholder =>
    new PlaceholderImpl(new ParentNodePlace(element), null)
