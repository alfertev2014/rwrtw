import { txt } from './dom'
import { Place, renderNode, unrenderNodes } from './place'

export interface Lifecycle {
    readonly mount?: () => void
    readonly unmount?: () => void
}

export class Lifecycles implements Lifecycle {
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

export class Renderer {
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
        return new Renderer({ parent: element }, this.parent)
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
            const renderer = new Renderer(this.place, this)
            const component = componentFunc(renderer)
            if (component instanceof Lifecycles) {
                this.addLifecycle(component)
            }
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
