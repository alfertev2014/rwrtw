import { PlainData } from "./types.js"

/**
 * Abstract observable node of reactive graph. Notifies its subscribers when stored value is changed.
 */
export interface Observable<out T extends PlainData = PlainData> {
  /**
   * Accessor for current value.
   *
   * Actualize current value if needed and remove changed sign from node.
   * If called in compute function or as a dependency of effect, the dependent node will subscribe on this observable.
   *
   * @returns current value
   */
  readonly current: () => T
}

/**
 * Statuses of observable node in reactive graph. Used as flag in every node.
 */

/**
 * Current value is actual and needn't be recomputed
 */
const NOT_CHANGED = 0

/**
 * Current value is possibly not actual.
 * New value could differ from current value after recompute.
 * But if dependencies are not changed recomputing is not needed.
 */
const POSSIBLY_CHANGED = 1

/**
 * Current value is definitely not actual and need to be recomputed.
 */
const CHANGED = 2

/**
 * Observable node is dangling and not connected to reactive graph.
 */
const DANGLING = -1

/**
 * Observable node is dangling and should not be connected to reactive graph
 */
const SUSPENDED = -2

type ChangedStatus =
  | typeof NOT_CHANGED
  | typeof POSSIBLY_CHANGED
  | typeof CHANGED
  | typeof DANGLING
  | typeof SUSPENDED

/**
 * Reactive observable node to manage subscribers
 */
class ObservableImpl<out T extends PlainData = PlainData> implements Observable<T> {
  /**
   * Current stored value or last computed value.
   *
   * Not actual if this._status !== NOT_CHANGED
   */
  _current: T | undefined

  /**
   * List of nodes that depends on this node
   */
  readonly _subscribers: Observer[] // TODO: Use Set?

  constructor() {
    this._current = undefined
    this._subscribers = []
  }

  /**
   * @see Observable.current
   */
  current(): T {
    if (trackingSubscriber !== null) {
      trackingSubscriber._subscribeTo(this)
    }
    this._recompute()
    return this._current as T
  }

  /**
   * Recompute current value and clear changed sign.
   */
  _recompute(): void {}

  /**
   * Add subscriber to this._subscribers set.
   *
   * @param subscriber Subscriber (effect or computed)
   */
  _subscribe(subscriber: Observer): void {
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
  _unsubscribe(subscriber: Observer): void {
    const index = this._subscribers.indexOf(subscriber)
    if (index >= 0) {
      this._subscribers.splice(index, 1)
    }
    if (this._subscribers.length === 0) {
      this._onDangling()
    }
  }

  _onDangling(): void {}

  _propagateChanged(): void {
    for (const subscriber of this._subscribers) {
      subscriber._markChanged()
    }
  }
}

interface Observer {
  readonly _markChanged: () => void
  readonly _markPossiblyChanged: () => void
}

/**
 * Reactive mutable source node for scalar value types
 */
export interface Source<T extends PlainData = PlainData> extends Observable<T> {
  /**
   * Modifier of the value.
   *
   * Store new value into the source.
   * Checks if value has changed.
   * Mark as changed and propagate changed sign to subscribers.
   * If called not in a transaction, run effects.
   *
   * @param value New value
   */
  readonly change: (value: T) => void

  /**
   * Modifier of the value with updating function.
   *
   * Updater function applies to previous value. The new value is passed to Source.change. @see Source.change
   *
   * @param updater Updater function.
   */
  readonly update: (updater: (prev: T) => T) => void
}

/**
 * @see Source
 */
export class SourceImpl<T extends PlainData = PlainData>
  extends ObservableImpl<T>
  implements Source<T>
{
  override _current: T
  constructor(initValue: T) {
    super()
    this._current = initValue
  }

  /**
   * @see Source.change
   */
  change(value: T): void {
    if (trackingSubscriber !== null) {
      throw new Error("Changing source value in compute function")
    }

    if (value !== this._current) {
      this._propagateChanged()
      this._current = value
      if (transactionDepth === 0) {
        runTasks()
      }
    }
  }

  /**
   * @see Source.update
   */
  update(updater: (prev: T) => T): void {
    this.change(updater(this._current))
  }
}

/**
 * Computed value node in reactive graph.
 * Caches its current value if observable dependencies are not changed.
 */
export type Computed<out T extends PlainData = PlainData> = Observable<T>

/**
 * @see Computed
 */
class ComputedImpl<out T extends PlainData = PlainData>
  extends ObservableImpl<T>
  implements Computed<T>, Observer
{
  /**
   * Status of current value actuality
   */
  _status: ChangedStatus

  /**
   * Compute function to recompute current value. Required to be pure!
   */
  readonly _computeFunc: () => T

  /**
   * Observable dependencies needed to compute value ordered by occurrences in compute function body
   */
  readonly _deps: ObservableImpl[]
  _depsCount: number

  constructor(computeFunc: () => T) {
    super()
    this._status = DANGLING
    this._computeFunc = computeFunc
    this._deps = []
    this._depsCount = 0
  }

  /**
   * Set CHANGED state and propagate POSSIBLY_CHANGED recursively to subscribers.
   */
  _markChanged(): void {
    if (this._status !== CHANGED) {
      if (this._status !== POSSIBLY_CHANGED) {
        for (const subscriber of this._subscribers) {
          subscriber._markPossiblyChanged()
        }
      }
      this._status = CHANGED
      this._current = undefined
    }
  }

  /**
   * Set POSSIBLY_CHANGED state and propagate it recursively to subscribers.
   */
  _markPossiblyChanged(): void {
    if (this._status === NOT_CHANGED) {
      this._status = POSSIBLY_CHANGED
      for (const subscriber of this._subscribers) {
        subscriber._markPossiblyChanged()
      }
    }
  }

  /**
   * Add itself to set of subscribers of observable dependency.
   * Add the observable to list of dependencies if it is not already there.
   * Dependencies are collected to list in order of the method calls
   * Dependencies are merged with old dependencies.
   * Not actual old dependencies will bubble to tail of the list.
   *
   * @param dependency Observable dependency
   */
  _subscribeTo(dependency: ObservableImpl): void {
    const count = this._depsCount
    const index = this._deps.indexOf(dependency)
    if (index < 0) {
      // if dependency is not present in list

      if (count < this._deps.length) {
        const d = this._deps[count]
        this._deps[count] = dependency // place it at current tracking count index
        this._deps.push(d) // move the old at the end without any array shifting
      } else {
        this._deps.push(dependency) // just push to the end
      }

      dependency._subscribe(this) // subscribe new dependency
      this._depsCount++
    } else if (index >= count) {
      // if dependency is present and is not tracked yet

      if (index > count) {
        // if it is nod already in right place

        const d = this._deps[count]
        this._deps[count] = dependency // place it at current tracking count index by swapping values
        this._deps[index] = d
      }
      this._depsCount++
      // we needn't call _subscribe for the dependency because it was already in list
    }
  }

  /**
   * If value is POSSIBLY_CHANGED try to recompute dependencies and check if they actually changed.
   * If one of dependencies changed the computed value become CHANGED and need to call compute function
   *
   * @see Observable.recompute
   */
  override _recompute(): void {
    if (this._status !== NOT_CHANGED) {
      if (this._status === POSSIBLY_CHANGED) {
        this._recomputeDeps()
      }
      // could become CHANGED here
      if (this._status === CHANGED || this._status === DANGLING) {
        this._callComputeFunc()
      }
    }
  }

  /**
   * Recompute dependencies and check if they changed.
   * If some dependency has signaled that its value was actually changed
   *   the computed become CHANGED and need to call compute function
   * If all the dependencies are not actually changed
   *   the computed become NOT_CHANGED and no need to call compute function
   */
  _recomputeDeps(): void {
    for (let i = 0; i < this._depsCount; ++i) {
      this._deps[i]._recompute()
      if (this._status === CHANGED) {
        this._depsCount = i
        return
      }
    }
    this._status = NOT_CHANGED
  }

  /**
   * Call the compute function in tracking context
   */
  _callComputeFunc(): void {
    const previousValue = this._current
    const prevTracking = trackingSubscriber
    trackingSubscriber = this // Establish new tracking context for this
    try {
      this._current = this._computeFunc()
    } finally {
      trackingSubscriber = prevTracking // restore previous tracking context

      // Unsubscribe from not actual dependencies at tail of list
      for (let i = this._depsCount; i < this._deps.length; ++i) {
        this._deps[i]._unsubscribe(this)
      }
      this._deps.length = this._depsCount // Remove the old dependencies from list
    }
    if (this._current !== previousValue) {
      // Signal for all subscribers that the value was really changed
      for (const subscriber of this._subscribers) {
        subscriber._markChanged()
      }
    }
    this._status = NOT_CHANGED // The value is now in actual state
  }

  _clearDeps(): void {
    for (const dependency of this._deps) {
      dependency._unsubscribe(this)
    }
    this._deps.length = 0
  }

  override _onDangling(): void {
    scheduleTask(() => {
      if (this._subscribers.length === 0) {
        this._clearDeps()
        this._status = DANGLING
      }
    })
  }
}

export interface Effect {
  readonly unsubscribe: () => void
  readonly suspend: () => void
  readonly resume: () => void
}

class EffectImpl<T extends PlainData = PlainData> implements Observer, Effect {
  _status: ChangedStatus
  readonly _trigger: ObservableImpl<T>
  readonly _sideEffectFunc: (value: T) => void
  constructor(trigger: ObservableImpl<T>, sideEffectFunc: (value: T) => void) {
    this._status = DANGLING
    this._trigger = trigger
    this._sideEffectFunc = sideEffectFunc
    this._schedule()
  }

  _markChanged(): void {
    if (this._status !== SUSPENDED) {
      if (this._status !== CHANGED && this._status !== POSSIBLY_CHANGED) {
        this._schedule()
      }
      this._status = CHANGED
    }
  }

  _markPossiblyChanged(): void {
    if (this._status !== SUSPENDED) {
      if (this._status !== CHANGED && this._status !== POSSIBLY_CHANGED) {
        this._schedule()
        this._status = POSSIBLY_CHANGED
      }
    }
  }

  _schedule(): void {
    scheduleTask(() => {
      if (this._status !== SUSPENDED) {
        const current = this._trigger.current()
        if (this._status === DANGLING) {
          this._trigger._subscribe(this)
        } else if (this._status === CHANGED) {
          this._sideEffectFunc(current)
        }
        this._status = NOT_CHANGED
      }
    })
  }

  suspend(): void {
    this._status = SUSPENDED
  }

  resume(): void {
    if (this._status === SUSPENDED) {
      this._schedule()
      this._status = POSSIBLY_CHANGED
    }
  }

  unsubscribe(): void {
    this._trigger._unsubscribe(this)
    this._status = SUSPENDED
  }
}

let trackingSubscriber: ComputedImpl | null = null

let taskQueue: Array<() => void> = []
let runningTasks: Array<() => void> = []

const scheduleTask = (task: () => void): void => {
  taskQueue.push(task)
}

const runTasks = (): void => {
  transactionDepth++
  while (taskQueue.length > 0) {
    const tmp = runningTasks
    runningTasks = taskQueue
    taskQueue = tmp
    for (const task of runningTasks) {
      try {
        task()
      } catch (e) {
        console.error(e)
      }
    }
    runningTasks.length = 0
  }
  transactionDepth--
}

let transactionDepth = 0

export const source = <T extends PlainData>(initValue: T): Source<T> => {
  if (trackingSubscriber !== null) {
    throw new Error("Creating source in tracking context")
  }
  return new SourceImpl<T>(initValue)
}

export const computed = <T extends PlainData>(func: () => T): Observable<T> => {
  if (trackingSubscriber !== null) {
    throw new Error("Creating computed in tracking context")
  }
  return new ComputedImpl(func)
}

export const effect = <T extends PlainData>(
  trigger: Observable<T>,
  sideEffectFunc: (value: T) => void,
): Effect => {
  if (!(trigger instanceof ObservableImpl)) {
    throw new Error("Trigger of effect is not observable")
  }
  if (trackingSubscriber !== null) {
    throw new Error("Creating effect in tracking context")
  }
  const res = new EffectImpl<T>(trigger as ObservableImpl<T>, sideEffectFunc)
  if (transactionDepth === 0) {
    runTasks()
  }
  return res
}

export const untrack = <T>(func: () => T): T => {
  if (trackingSubscriber === null) {
    return func()
  }
  const prevTracking = trackingSubscriber
  trackingSubscriber = null
  try {
    return func()
  } finally {
    trackingSubscriber = prevTracking
  }
}

export const transaction = <T>(func: () => T): T => {
  if (trackingSubscriber !== null) {
    throw new Error("Running transaction in tracking context")
  }

  transactionDepth++
  try {
    return func()
  } finally {
    transactionDepth--
    if (transactionDepth === 0) {
      runTasks()
    }
  }
}
