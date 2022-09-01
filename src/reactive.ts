
class Observable<T = unknown> {
    _computeFunc: () => T
    _current: T
    _dependencies: Observable[]
    _deriveds: Observable[]
    _dirty: boolean
    readonly isEffect: boolean

    constructor(computeFunc: () => T, isEffect = false) {
        this._computeFunc = computeFunc
        this._current = computeFunc()
        this._dependencies = []
        this._deriveds = []
        this._dirty = true
        this.isEffect = isEffect
    }

    current() {
        if (inTransaction && dependenciesStack.length > 0) {
            const observable = dependenciesStack[dependenciesStack.length - 1]
            observable._dependencies.push(this)
            this._deriveds.push(observable)
        }
        this._recompute()
        return this._current
    }

    change(computeFunc: () => T) {
        this._dirty = true
        this._computeFunc = computeFunc
        this._recompute()
    }

    _recompute() {
        if (this._dirty) {
            if (this._computeFunc) {
                dependenciesStack.push(this)
                this._clearDependencies()
                const value = this._computeFunc()
                if (value !== this._current) {
                    this._makeDirty()
                }
                this._current = value
            }
            this._dirty = false
        }
    }

    disconnect(derived: Observable) {
        this._deriveds = this._deriveds.filter((d) => d !== derived)
    }

    _makeDirty() {
        if (this._dirty) {
            return
        }
        this._dirty = true
        if (this.isEffect) {
            observerQueue.push(this)
        }
        for (const derived of this._deriveds) {
            derived._makeDirty()
        }
    }

    _clearDependencies(): void {
        for (const dependency of this._dependencies) {
            dependency.disconnect(this)
        }
        this._dependencies.length = 0
    }
}

const observerQueue: Observable[] = []

const dependenciesStack: Observable[] = []

let inTransaction = false

export const source = <T>(initValue: T): Observable<T> => {
    return new Observable(() => initValue)
}

export const derived = <T>(func: () => T): Observable<T> => {
    return new Observable(func)
}

export const effect = <T>(func: () => T): Observable<T> => {
    return new Observable(func, true)
}

export const transaction = (func: () => void) => {
    inTransaction = true
    func()
    inTransaction = false
}
