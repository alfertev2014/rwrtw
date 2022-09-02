import { Placeholder, plh } from '../internal/placeholder'
import { ComponentFactory, Renderer } from '../internal/renderer'

export interface Switch<T> {
    value: T
}

export type CaseBranch<T> = [T, ComponentFactory | null]

class SwitchImpl<T> implements Switch<T> {
    _value: T
    branches: CaseBranch<T>[]
    defaultBranch: ComponentFactory | null
    readonly placeholder: Placeholder

    constructor(
        renderer: Renderer,
        value: T,
        branches: CaseBranch<T>[],
        defaultBranch: ComponentFactory | null
    ) {
        this._value = value
        this.branches = branches
        this.defaultBranch = defaultBranch
        this.placeholder = plh(this._selectBranch())(renderer)
    }

    get value() {
        return this._value
    }

    set value(value: T) {
        if (this._value !== value) {
            this.placeholder.setContent(this._selectBranch())
            this._value = value
        }
    }

    _selectBranch() {
        for (const branch of this.branches) {
            if (this.value === branch[0]) {
                return branch[1]
            }
        }
        return this.defaultBranch
    }
}

export const switchElse =
    <T>(
        value: T,
        branches: CaseBranch<T>[],
        defaultBranch: ComponentFactory | null = null
    ): ComponentFactory<Switch<T>> =>
    (renderer: Renderer) =>
        new SwitchImpl(renderer, value, branches, defaultBranch)
