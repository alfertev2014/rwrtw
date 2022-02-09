import { DOMPlace, Place, unrenderNodes } from "place"

export interface Lifecycle {
    mount?: () => void
    unmount?: () => void
}

export abstract class Component implements Lifecycle {
    parent: Component | null
    place: Place
    lastPlace: Place

    constructor(place: Place, parent: Component | null = null) {
        this.place = place
        this.lastPlace = place
        this.parent = parent
    }

    abstract render(): void
    abstract mount(): void
    abstract unmount(): void

    unrender() {
        unrenderNodes(this.place, this.lastPlace)
        this.lastPlace = this.place
    }
}

export abstract class ParentComponent extends Component {
    lifecycles: Lifecycle[]
    constructor(place: Place, parent: Component | null = null) {
        super(place, parent)
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