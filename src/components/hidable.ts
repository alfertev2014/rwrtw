import { ComponentFactory, Placeholder, plh, Renderer } from '../component'

export class Hidable<T = unknown> {
    readonly renderFunc: ComponentFactory<T>
    readonly placeholder: Placeholder
    visible: boolean

    constructor(renderer: Renderer, componentFunc: ComponentFactory<T>) {
        this.renderFunc = componentFunc
        this.placeholder = plh(componentFunc)(renderer)
        renderer.addLifecycle(this.placeholder)
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

export const hidable =
    <T>(componentFunc: ComponentFactory<T>): ComponentFactory<Hidable<T>> =>
    (renderer: Renderer) =>
        new Hidable<T>(renderer, componentFunc)
