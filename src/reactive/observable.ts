export interface Observable<T = unknown> {
  current: () => T
}

enum ChangedState {
  NOT_CHANGED = 0,
  POSSIBLY_CHANGED = 1,
  CHANGED = 2,
}

/**
 * Reactive observable node to manage subscribers
 */
class ObservableImpl<T = unknown> implements Observable<T> {
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
  _changed: ChangedState
  readonly _subscribers: ObservableImpl[] // List of nodes that depends on this node

  constructor() {
    this._current = undefined
    this._changed = ChangedState.CHANGED
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
  current(): T {
    if (trackingComputed !== null) {
      trackingComputed._subscribeTo(this)
    }
    this._recompute()
    return this._current as T
  }

  /**
   * Recompute current value and clear changed sign.
   *
   * @returns true if value was actually changed.
   */
  _recompute(): void {
    this._changed = ChangedState.NOT_CHANGED
  }

  /**
   * Add subscriber to this._subscribers set.
   *
   * @param subscriber Subscriber (effect or computed)
   */
  _subscribe(subscriber: ComputedImpl): void {
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
  _unsubscribe(subscriber: ObservableImpl): void {
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
    if (this._changed !== ChangedState.CHANGED) {
      if (this._changed !== ChangedState.POSSIBLY_CHANGED) {
        for (const subscriber of this._subscribers) {
          subscriber._markPossiblyChanged()
        }
      }
      this._changed = ChangedState.CHANGED
      this._onChanged()
    }
  }

  /**
   * Set changed sign and propagate it recursively to subscribers.
   *
   */
  _markPossiblyChanged(): void {
    if (this._changed === ChangedState.NOT_CHANGED) {
      this._changed = ChangedState.POSSIBLY_CHANGED
      this._onChanged()
      for (const subscriber of this._subscribers) {
        subscriber._markPossiblyChanged()
      }
    }
  }

  /**
   * Hook called when the node is marked as changed
   */
  _onChanged(): void {}
}

export interface Source<T = unknown> extends Observable<T> {
  change: (value: T) => void
}

/**
 * Reactive source node for scalar value types
 */
class SourceImpl<T = unknown> extends ObservableImpl<T> implements Source<T> {
  constructor(initValue: T) {
    super()
    this._current = initValue
  }

  /**
   * Modifier of the value.
   *
   * Checks if value changed.
   * Mark as changed and propagate changed sign to subscribers.
   * If called not in a transaction, run effects.
   *
   * @param value New value
   */
  change(value: T): void {
    if (value !== this._current) {
      this._changed = ChangedState.CHANGED
      for (const subscriber of this._subscribers) {
        subscriber._markChanged()
      }
      this._current = value
      if (transactionDepth === 0) {
        runEffects()
      }
    }
  }
}

class ComputedImpl<T = unknown> extends ObservableImpl<T> {
  readonly _computeFunc: () => T
  readonly _dependencies: ObservableImpl[]
  _dependenciesCount: number

  constructor(computeFunc: () => T) {
    super()
    this._computeFunc = computeFunc
    this._dependencies = []
    this._dependenciesCount = 0
  }

  _subscribeTo(dependency: ObservableImpl): void {
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

  override _recompute(): void {
    if (this._changed !== ChangedState.NOT_CHANGED) {
      if (this._changed === ChangedState.POSSIBLY_CHANGED) {
        this._recomputeDependencies()
      }
      if (this._changed === ChangedState.CHANGED) {
        const previousValue = this._current
        const prevTracking = trackingComputed
        trackingComputed = this
        try {
          this._current = this._computeFunc()
        } finally {
          trackingComputed = prevTracking
          for (let i = this._dependenciesCount; i < this._dependencies.length; ++i) {
            this._dependencies[i]._unsubscribe(this)
          }
          this._dependencies.length = this._dependenciesCount
        }
        if (this._current !== previousValue) {
          for (const subscriber of this._subscribers) {
            subscriber._markChanged()
          }
          this._changed = ChangedState.NOT_CHANGED
        }
      }
    }
  }

  _recomputeDependencies(): void {
    for (let i = 0; i < this._dependenciesCount; ++i) {
      this._dependencies[i]._recompute()
      if (this._changed === ChangedState.CHANGED) {
        this._dependenciesCount = i
        return
      }
    }
    this._changed = ChangedState.NOT_CHANGED
  }
}

class EffectImpl extends ComputedImpl<undefined> {
  // TODO: Effect is simply callback with side effect on observable

  // TODO: What if effect called inside effect?

  override _onChanged(): void {
    effectsQueue.push(this)
  }
}

let trackingComputed: ComputedImpl | null = null

let effectsQueue: EffectImpl[] = []
let runningEffects: EffectImpl[] = []

const runEffects = (): void => {
  while (effectsQueue.length > 0) {
    const tmp = runningEffects
    runningEffects = effectsQueue
    effectsQueue = tmp
    for (const effect of runningEffects) {
      try {
        effect.current()
      } catch (e) {
        console.error(e)
      }
    }
    runningEffects.length = 0
  }
}

let transactionDepth = 0

export const source = <T>(initValue: T): Source<T> => {
  return new SourceImpl<T>(initValue)
}

export const computed = <T>(func: () => T): Observable<T> => {
  return new ComputedImpl(func)
}

export const effect = (func: () => undefined): Observable<undefined> => {
  return new EffectImpl(func)
}

export const transaction = (func: () => void): void => {
  // TODO: Prohibit calling transaction in computed functions

  transactionDepth++
  try {
    func()
  } finally {
    transactionDepth--
    if (transactionDepth === 0) {
      runEffects()
    }
  }
}
