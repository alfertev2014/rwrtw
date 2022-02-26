import { Place, unrenderNodes } from './place'

export interface Lifecycle {
    readonly mount?: () => void
    readonly unmount?: () => void
}

export abstract class Component implements Lifecycle {
    readonly parent: Component | null
    readonly place: Place
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
    readonly lifecycles: Lifecycle[]
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

export interface ComponentFactory<T extends Component = Component> {
    (place: Place, parent: Component | null): T
}

export class Hidable<T extends Component = Component> extends Component {
    readonly componentFunc: ComponentFactory<T>
    rendered: T | null
    visible: boolean
    constructor(componentFunc: ComponentFactory<T>, place: Place, parent: Component | null = null) {
        super(place, parent)
        this.componentFunc = componentFunc
        this.rendered = null
        this.visible = false
    }

    render(): void {
        this.rendered = this.componentFunc(this.place, this.parent)
        this.lastPlace = this.rendered.lastPlace
        this.visible = true
    }

    show() {
        if (!this.visible && this.rendered) {
            this.rendered.render()
            this.lastPlace = this.rendered.lastPlace
            this.rendered.mount()
            this.visible = true
        }
    }

    hide() {
        if (this.visible && this.rendered) {
            this.rendered.unmount()
            this.rendered.unrender()
            this.lastPlace = this.place
            this.visible = false
        }
    }

    mount(): void {
        if (this.rendered) {
            this.rendered.mount()
        }
    }

    unmount(): void {
        if (this.rendered) {
            this.rendered.unmount()
        }
    }
}
