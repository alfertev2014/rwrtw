import { ComponentFactory, Renderer } from '../component'
import { ifElse, IfElse } from './ifElse'

export interface Hidable {
    hide(): void
    show(): void
    visible: boolean
}

class HidableImpl<T = unknown> implements Hidable {
    ifElse: IfElse

    constructor(renderer: Renderer, componentFunc: ComponentFactory<T>) {
        this.ifElse = ifElse(true, componentFunc, null)(renderer)
    }

    get visible() {
        return this.ifElse.condition
    }

    set visible(value: boolean) {
        this.ifElse.condition = value
    }

    hide() {
        this.visible = false
    }

    show() {
        this.visible = true
    }
}

export const hidable =
    <T>(componentFunc: ComponentFactory<T>): ComponentFactory<Hidable> =>
    (renderer: Renderer) =>
        new HidableImpl(renderer, componentFunc)
