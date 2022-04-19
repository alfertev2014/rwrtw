import { Place, unrenderNodes } from './place'

export interface Lifecycle {
    readonly mount?: () => void
    readonly unmount?: () => void
}

export class ParentComponent implements Lifecycle {
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

export abstract class Component implements Lifecycle {
    abstract get lastPlace(): Place
    abstract mount(): void
    abstract unmount(): void
}

export interface ComponentFactory<T extends Component = Component> {
    (place: Place, parent: ParentComponent): { lastPlace: Place, component: T | null }
}

export class Placeholder extends Component {
    place: Place
    readonly lifecycles: ParentComponent
    lastPlace: Place
    visible: boolean
    constructor(place: Place) {
        super()
        this.place = place
        this.lifecycles = new ParentComponent()
        this.lastPlace = place
        this.visible = false
    }

    renderContent<T extends Component = Component>(componentFunc: ComponentFactory<T>) {
        const { lastPlace, component } = componentFunc(this.place, this.lifecycles)
        if (component) {
            this.lifecycles.addLifecycle(component)
        }
        this.lastPlace = lastPlace
    }

    mount() {
        this.lifecycles.mount()
        this.visible = true
    }

    unmount() {
        this.lifecycles.unmount()
    }

    spawnBefore(): Placeholder {
        const spawned = new Placeholder(this.place)
        this.place = spawned
        return spawned
    }

    setContent<T extends Component = Component>(componentFunc: ComponentFactory<T>) {
        this.hide()
        if (!this.visible) {
            this.renderContent(componentFunc)
            this.lifecycles.mount()
            this.visible = true
        }
    }

    hide() {
        if (this.visible) {
            this.lifecycles.unmount()
            unrenderNodes(this.place, this.lastPlace)
            this.lastPlace = this.place
            this.visible = false
        }
    }
}

export class Hidable<T extends Component = Component> extends Placeholder {
    readonly componentFunc: ComponentFactory<T>
    
    constructor(place: Place, componentFunc: ComponentFactory<T>) {
        super(place)
        this.componentFunc = componentFunc
        this.renderContent(componentFunc)
    }

    show() {
        if (!this.visible) {
            super.setContent(this.componentFunc)
        }
    }
}
