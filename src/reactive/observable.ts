class Observable<T = unknown> {
  _current: T | undefined
  _dirty: boolean
  readonly _deriveds: Observable[]

  constructor() {
    this._current = undefined
    this._dirty = true
    this._deriveds = []
  }

  current(): T | undefined {
    if (trakingStack.length > 0) {
      trakingStack[trakingStack.length - 1]._subscribe(this)
    }
    this._recompute()
    return this._current
  }

  change(value: T): void {
    if (value !== this._current) {
      this._makeDirty()
    }
    this._current = value
    if (transactionDepth === 0) {
      runEffects()
    }
  }

  _recompute(): boolean {
    const res = this._dirty
    this._dirty = false
    return res
  }

  _connect(derived: Computed): void {
    const index = this._deriveds.indexOf(derived)
    if (index < 0) {
      this._deriveds.push(derived)
    }
  }

  _disconnect(derived: Observable): void {
    const index = this._deriveds.indexOf(derived)
    if (index >= 0) {
      this._deriveds.splice(index, 1)
    }
  }

  _makeDirty(): void {
    if (!this._dirty) {
      this._dirty = true
      this._onDirty()
      for (const derived of this._deriveds) {
        derived._makeDirty()
      }
    }
  }

  _onDirty(): void {
    return undefined
  }
}

class Computed<T = unknown> extends Observable<T> {
  readonly _computeFunc: () => T
  readonly _dependencies: Observable[]
  _dependenciesCount: number

  constructor(computeFunc: () => T) {
    super()
    this._computeFunc = computeFunc
    this._dependencies = []
    this._dependenciesCount = 0
  }

  _subscribe(dependency: Observable): void {
    const count = this._dependenciesCount
    const index = this._dependencies.indexOf(dependency)
    if (index < 0) {
      this._dependencies.splice(count, 0, dependency)
      dependency._connect(this)
      this._dependenciesCount++
    } else if (index >= count) {
      if (index > count) {
        const d = this._dependencies[count]
        this._dependencies[count] = dependency
        this._dependencies[index] = d
      }
      this._dependenciesCount++
    }
  }

  _recompute(): boolean {
    if (this._dirty) {
      const current = this._current
      if (this._recomputeDependencies()) {
        trakingStack.push(this)
        this._current = this._computeFunc()
        trakingStack.pop()
        for (let i = this._dependenciesCount; i < this._dependencies.length; ++i) {
          this._dependencies[i]._disconnect(this)
        }
        this._dependencies.length = this._dependenciesCount
      }
      this._dirty = false
      return this._current !== current
    }
    return false
  }

  _recomputeDependencies(): boolean {
    for (let i = 0; i < this._dependenciesCount; ++i) {
      const dependency = this._dependencies[i]
      if (dependency._recompute()) {
        this._dependenciesCount = i
        return true
      }
    }
    return this._dependenciesCount === 0
  }
}

class Effect extends Computed<undefined> {
  _onDirty(): void {
    effectsQueue.push(this)
  }
}

const trakingStack: Computed[] = []

let effectsQueue: Effect[] = []
let runningEffects: Effect[] = []

const runEffects = (): void => {
  while (effectsQueue.length > 0) {
    const tmp = runningEffects
    runningEffects = effectsQueue
    effectsQueue = tmp
    for (const effect of runningEffects) {
      effect.current()
    }
    runningEffects.length = 0
  }
}

let transactionDepth = 0

export const source = <T>(initValue: T): Observable<T> => {
  const res = new Observable<T>()
  res.change(initValue)
  return res
}

export const derived = <T>(func: () => T): Computed<T> => {
  return new Computed(func)
}

export const effect = (func: () => undefined): Effect => {
  return new Effect(func)
}

export const transaction = (func: () => void): void => {
  transactionDepth++
  func()
  transactionDepth--
  if (transactionDepth === 0) {
    runEffects()
  }
}
