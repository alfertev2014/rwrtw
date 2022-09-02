import { Placeholder, plh } from '../internal/placeholder'
import { ComponentFactory, Renderer } from '../internal/renderer'

export interface IfElse {
    condition: boolean
}

class IfElseImpl implements IfElse {
    _value: boolean
    readonly trueBranch: ComponentFactory | null
    readonly falseBranch: ComponentFactory | null
    readonly placeholder: Placeholder

    constructor(
        renderer: Renderer,
        condition: boolean,
        trueBranch: ComponentFactory | null,
        falseBranch: ComponentFactory | null
    ) {
        this._value = condition
        this.trueBranch = trueBranch
        this.falseBranch = falseBranch
        this.placeholder = plh(condition ? trueBranch : falseBranch)(renderer)
    }

    get condition() {
        return this._value
    }

    set condition(value: boolean) {
        if (this._value !== value) {
            this.placeholder.setContent(value ? this.trueBranch : this.falseBranch)
            this._value = value
        }
    }
}

export const ifElse =
    (
        condition: boolean,
        trueBranch: ComponentFactory | null,
        falseBranch: ComponentFactory | null
    ): ComponentFactory<IfElse> =>
    (renderer: Renderer) =>
        new IfElseImpl(renderer, condition, trueBranch, falseBranch)
