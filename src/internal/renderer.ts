import { Lifecycle, Lifecycles } from '../lifecycle'
import { dce, txt } from '../dom'
import { Place, PlaceType, renderNode } from './place'
import { Placeholder, PlaceholderImpl } from './placeholder'
import { List, ListImpl } from './list'

export interface Renderer {
    renderText(text: string): Text
    renderDomNode(node: Node): Node
    renderElement(tag: string, childrenFunc?: ComponentFactory): HTMLElement
    renderPlaceholder(componentFunc: ComponentFactory | null): Placeholder
    renderList(componentFuncs: ComponentFactory[]): List
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

    renderPlaceholder(componentFunc: ComponentFactory | null = null): Placeholder {
        const p = new PlaceholderImpl(this.place)
        this.place = { type: PlaceType.Placeholder, placeholder: p }
        this.addLifecycle(p)
        p.renderContent(componentFunc)
        return p
    }

    renderList(componentFuncs: ComponentFactory[]): List {
        const l = new ListImpl(this.place, componentFuncs)
        this.addLifecycle(l)
        return l
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
