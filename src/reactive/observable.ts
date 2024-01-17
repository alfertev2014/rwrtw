/**
 * Reactive source node for scalar value types
 */
class Observable<T = unknown> {
  // TODO: T should be scalar value

  /**
   * Current stored value or last computed value.
   *
   * Not actual if this._changed === true.
   */
  _current: T | undefined

  /**
   * Value has changed and not consumed by any other nodes yet.
   *
   * If true, this._current is not actual, recomputing needed.
   */
  _changed: boolean
  readonly _subscribers: Observable[] // List of nodes that depends on this node

  constructor() {
    this._current = undefined
    this._changed = true
    this._subscribers = []
  }

  /**
   * Accessor for current value.
   *
   * Actualize current value if needed and remove changed sign from node.
   * If called in tracking context, the dependent node that consume the value will subscribe on this node.
   *
   * @returns current value
   */
  current(): T | undefined {
    if (trackingComputed !== null) {
      trackingComputed._subscribe(this)
    }
    this._recompute()
    return this._current
  }

  /**
   * Modifier of the value.
   *
   * Checks if value changed.
   * Mark as changed and propagate changed sing to subscribers.
   * If called not in a transaction, run effects.
   *
   * @param value New value
   */
  change(value: T): void {
    if (value !== this._current) {
      this._markChanged()
    }
    this._current = value
    if (transactionDepth === 0) {
      runEffects()
    }
  }

  /**
   * Recompute current value and clear changed sign.
   *
   * @returns true if value was actually changed.
   */
  _recompute(): boolean {
    const res = this._changed
    this._changed = false
    return res
  }

  /**
   * Add subscriber to this._subscribers set.
   *
   * @param subscriber Subscriber (effect or computed)
   */
  _subscribe(subscriber: Computed): void {
    const index = this._subscribers.indexOf(subscriber)
    if (index < 0) {
      this._subscribers.push(subscriber)
    }
  }

  /**
   * Remove subscriber from this._subscribers set.
   *
   * @param subscriber Subscriber (effect or computed)
   */
  _unsubscribe(subscriber: Observable): void {
    const index = this._subscribers.indexOf(subscriber)
    if (index >= 0) {
      this._subscribers.splice(index, 1)
    }
  }

  /**
   * Set changed sign and propagate it recursively to subscribers.
   *
   */
  _markChanged(): void {
    if (!this._changed) {
      this._changed = true
      this._onChanged()
      for (const derived of this._subscribers) {
        derived._markChanged()
      }
    }
  }

  /**
   * Hook called when the node is marked as changed
   */
  _onChanged(): void {}
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

  // TODO: method "change" should not be available here

  override _subscribe(dependency: Observable): void {
    const count = this._dependenciesCount
    const index = this._dependencies.indexOf(dependency)
    if (index < 0) {
      this._dependencies.splice(count, 0, dependency)
      dependency._subscribe(this)
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

  override _recompute(): boolean {
    if (this._changed) {
      const current = this._current
      if (this._recomputeDependencies()) {
        const prevTracking = trackingComputed
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        trackingComputed = this
        try {
          this._current = this._computeFunc()
        } finally {
          trackingComputed = prevTracking
        }
        for (let i = this._dependenciesCount; i < this._dependencies.length; ++i) {
          this._dependencies[i]._unsubscribe(this)
        }
        this._dependencies.length = this._dependenciesCount
      }
      this._changed = false
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
  // TODO: Effect is simply callback with side effect on observable

  // TODO: What if effect called inside effect?

  override _onChanged(): void {
    effectsQueue.push(this)
  }
}

let trackingComputed: Computed | null = null

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

export const computed = <T>(func: () => T): Computed<T> => {
  return new Computed(func)
}

export const effect = (func: () => undefined): Effect => {
  return new Effect(func)
}

export const transaction = (func: () => void): void => {
  transactionDepth++
  try {
    func()
  } finally {
    transactionDepth--
  }
  if (transactionDepth === 0) {
    runEffects()
  }
}
