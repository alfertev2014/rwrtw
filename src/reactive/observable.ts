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
        if (dependenciesStack.length > 0) {
            const observable = dependenciesStack[dependenciesStack.length - 1]
            observable._dependencies.push(this)
            this._deriveds.push(observable)
        }
        this._recompute()
        return this._current
    }

    change(computeFunc: () => T) {
        transactionQueue.push(() => {
            this._dirty = true
            this._computeFunc = computeFunc
            this._recompute()
        })
        if (!inTransaction) {
            commitTransaction()
        }
    }

    _recompute() {
        if (this._dirty) {
            if (this._computeFunc) {
                this._clearDependencies()
                dependenciesStack.push(this)
                const value = this._computeFunc()
                dependenciesStack.pop()
                if (value !== this._current) {
                    this._makeDirty()
                }
                this._current = value
            }
            this._dirty = false
        }
    }

    _disconnect(derived: Observable) {
        this._deriveds = this._deriveds.filter((d) => d !== derived)
    }

    _makeDirty() {
        if (!this._dirty) {
            this._dirty = true
            if (this.isEffect) {
                observerQueue.push(this)
            }
            for (const derived of this._deriveds) {
                derived._makeDirty()
            }
        }
    }

    _clearDependencies(): void {
        for (const dependency of this._dependencies) {
            dependency._disconnect(this)
        }
        this._dependencies.length = 0
    }
}

const dependenciesStack: Observable[] = []

const observerQueue: Observable[] = []
let observersAreRunning = false

const runObservers = () => {
    observersAreRunning = true
    for (const observer of observerQueue) {
        observer.current()
    }
    observerQueue.length = 0
    observersAreRunning = false
}

let inTransaction = false

const transactionQueue: (() => void)[] = []

const commitTransaction = () => {
    if (observersAreRunning) {
        throw new Error('Trying to run transaction when observers are running')
    }

    for (const action of transactionQueue) {
        action()
    }
    transactionQueue.length = 0
    runObservers()
}

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
    commitTransaction()
}
