import { Lifecycles } from '../lifecycle'
import { Place, PlaceType, renderNode, takeNodes, unrenderNodes } from './place'
import { ComponentFactory, Renderer, RendererImpl } from './renderer'

export interface Placeholder {
    setContent<T>(componentFunc: ComponentFactory<T> | null): void
}

export class PlaceholderImpl extends Lifecycles {
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
    (renderer: Renderer) => renderer.renderPlaceholder(componentFunc)
