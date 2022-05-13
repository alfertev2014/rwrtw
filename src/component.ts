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

export class Component implements Lifecycle {
    mount(): void {
        // do nothing
    }
    unmount(): void {
        // do nothing
    }
}

export interface ComponentFactory<T extends Component | HTMLElement = Component | HTMLElement> {
    (place: Place, parent: ParentComponent): { lastPlace: Place, component: T | null }
}

export class Placeholder extends Component {
    place: Place
    readonly lifecycles: ParentComponent
    lastPlace: Place
    constructor(place: Place) {
        super()
        this.place = place
        this.lifecycles = new ParentComponent()
        this.lastPlace = place
    }

    renderContent<T extends Component | HTMLElement>(componentFunc: ComponentFactory<T> | null) {
        if (componentFunc) {
            const { lastPlace, component } = componentFunc(this.place, this.lifecycles)
            if (component instanceof Component) {
                this.lifecycles.addLifecycle(component)
            }
            this.lastPlace = lastPlace
        }
    }

    mount() {
        this.lifecycles.mount()
    }

    unmount() {
        this.lifecycles.unmount()
    }

    spawnBefore(): Placeholder {
        const spawned = new Placeholder(this.place)
        this.place = spawned
        return spawned
    }

    setContent<T extends Component | HTMLElement>(componentFunc: ComponentFactory<T> | null) {
        this.lifecycles.unmount()
        unrenderNodes(this.place, this.lastPlace)
        this.lastPlace = this.place
        this.renderContent(componentFunc)
        this.lifecycles.mount()
    }
}

export class Hidable<T extends Component | HTMLElement = Component | HTMLElement> extends Component {
    readonly renderFunc: ComponentFactory<T>
    readonly placeholder: Placeholder
    visible: boolean
    
    constructor(place: Place, parent: ParentComponent, componentFunc: ComponentFactory<T>) {
        super()
        this.placeholder = new Placeholder(place)
        this.renderFunc = componentFunc
        this.placeholder.renderContent(componentFunc)
        parent.addLifecycle(this.placeholder)
        this.visible = true
    }

    get lastPlace() {
        return this.placeholder
    }

    hide() {
        if (this.visible) {
            this.placeholder.setContent(null)
            this.visible = false
        }
    }

    show() {
        if (!this.visible) {
            this.placeholder.setContent(this.renderFunc)
            this.visible = true
        }
    }
}
