import { Lifecycle, Lifecycles } from '../lifecycle'
import { dce, txt } from '../dom'
import { Place, PlaceType, renderNode } from './place'

export interface Renderer {
    readonly place: Place // TODO: Hide this from public API
    renderText(text: string): Text
    renderDomNode(node: Node): Node
    renderElement(tag: string, childrenFunc?: ComponentFactory): HTMLElement
    addLifecycle(lifecycle: Lifecycle | null | undefined): void
}

export class RendererImpl implements Renderer {
    place: Place
    parent: Lifecycles
    constructor(place: Place, parent: Lifecycles) {
        this.place = place
        this.parent = parent
    }

    renderText(text: string) {
        const node = renderNode(this.place, txt(text))
        this.place = { type: PlaceType.Node, node }
        return node
    }

    renderDomNode(node: Node) {
        const rendered = renderNode(this.place, node)
        this.place = { type: PlaceType.Node, node: rendered }
        return rendered
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
