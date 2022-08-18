import { Place } from '../place'
import { ComponentFactory, Lifecycles, Placeholder } from '../component'

export class Hidable<T = unknown> {
    readonly renderFunc: ComponentFactory<T>
    readonly placeholder: Placeholder
    visible: boolean

    constructor(place: Place, parent: Lifecycles, componentFunc: ComponentFactory<T>) {
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

export const hidable = <T>(componentFunc: ComponentFactory<T>): ComponentFactory<Hidable<T>> => {
    return (place: Place, parent: Lifecycles) => {
        const h = new Hidable<T>(place, parent, componentFunc)
        return { lastPlace: h.lastPlace, component: h }
    }
}
