import { Place, unrenderNodes } from './place'

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

export interface ComponentFactory<T = unknown> {
    (place: Place, parent: Lifecycles): { lastPlace: Place; component: T }
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
            const { lastPlace, component } = componentFunc(this.place, this)
            if (component instanceof Lifecycles) {
                this.addLifecycle(component)
            }
            this.lastPlace = lastPlace
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
