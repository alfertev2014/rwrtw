import { ComponentFactory, Placeholder, plh, Renderer } from '../component'

export interface Hidable {
    hide(): void
    show(): void
    readonly visible: boolean
}

class HidableImpl<T = unknown> implements Hidable {
    readonly componentFunc: ComponentFactory<T>
    readonly placeholder: Placeholder
    visible: boolean

    constructor(renderer: Renderer, componentFunc: ComponentFactory<T>) {
        this.componentFunc = componentFunc
        this.placeholder = plh(componentFunc)(renderer)
        this.visible = true
    }

    hide() {
        if (this.visible) {
            this.placeholder.setContent(null)
            this.visible = false
        }
    }

    show() {
        if (!this.visible) {
            this.placeholder.setContent(this.componentFunc)
            this.visible = true
        }
    }
}

export const hidable =
    <T>(componentFunc: ComponentFactory<T>): ComponentFactory<Hidable> =>
    (renderer: Renderer) =>
        new HidableImpl(renderer, componentFunc)
