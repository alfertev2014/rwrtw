import { PlainData } from "../types.js"

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
 * Observable node is dangling and should not be connected to reactive graph.
 */
const SUSPENDED = -2

/**
 * Status of observable node in reactive graph.
 */
type ChangedStatus =
  | typeof NOT_CHANGED
  | typeof POSSIBLY_CHANGED
  | typeof CHANGED
  | typeof DANGLING
  | typeof SUSPENDED

/**
 * Internal assertion error in reactive
 */
class ObservableAssertionError extends Error {}

/**
 * Assert that condition is true.
 * Throw exception with message otherwise.
 *
 * @param condition Condition to check
 * @param message Error message if condition is not true
 */
export const observableAssert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new ObservableAssertionError(message)
  }
}

/**
 * Assert that execution is not in a compute function.
 *
 * @param message Error message for exception
 */
export const assertIsNotInComputing = (
  message: string = "Doing something in compute function",
) => {
  observableAssert(trackingSubscriber === null, message)
}

/**
 * Reactive observable node to manage subscribers.
 */
class ObservableImpl<out T extends PlainData = PlainData>
  implements Observable<T>
{
  /**
   * Current stored value or last computed value.
   *
   * Not actual if this._status !== NOT_CHANGED.
   */
  _current: T | undefined

  /**
   * List of nodes that depends on this node.
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

/**
 * Check that value is Observable node
 * @param value Plain value or Observable node.
 * @returns True if value is Observable node.
 */
export const isObservable = (
  value: PlainData | Observable<PlainData>,
): value is Observable => value instanceof ObservableImpl

/**
 * Get current() of value if value is Observable. Returns value as is otherwise.
 * @param value Plain value or Observable node.
 * @returns Current value of Observable or value as is.
 */
export const currentOf = <T extends PlainData>(value: T | Observable<T>): T =>
  isObservable(value) ? value.current() : value

interface Observer {
  readonly _markChanged: () => void
  readonly _markPossiblyChanged: () => void
  readonly _cleanup: () => void
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
   * If called not in a batch, run effects.
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
class SourceImpl<T extends PlainData = PlainData>
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
    assertIsNotInComputing("Changing source value in compute function")

    if (value !== this._current) {
      this._propagateChanged()
      this._current = value
      if (batchDepth === 0) {
        runQueues()
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
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Computed<out T extends PlainData = PlainData>
  extends Observable<T> {}

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
        this._deps.push(this._deps[count]) // move the old at the end without any array shifting
        this._deps[count] = dependency // place it at current tracking count index
      } else {
        this._deps.push(dependency) // just push to the end
      }

      dependency._subscribe(this) // subscribe new dependency
      this._depsCount++
    } else if (index >= count) {
      // if dependency is present and is not tracked yet

      if (index > count) {
        // if it is nod already in right place

        this._deps[index] = this._deps[count]
        this._deps[count] = dependency // place it at current tracking count index by swapping values
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
   * Call the compute function in compute function
   */
  _callComputeFunc(): void {
    const previousValue = this._current
    const prevTracking = trackingSubscriber
    trackingSubscriber = this // Establish new compute function for this
    try {
      this._current = this._computeFunc()
    } finally {
      trackingSubscriber = prevTracking // restore previous compute function

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

  _cleanup(): void {
    if (this._subscribers.length === 0) {
      for (const dependency of this._deps) {
        dependency._unsubscribe(this)
      }
      this._deps.length = 0
      this._depsCount = 0
      this._status = DANGLING
    }
  }

  override _onDangling(): void {
    cleanupQueue.push(this)
  }
}

export interface Effect {
  readonly unsubscribe: () => void
  readonly suspend: () => void
  readonly resume: () => void
}

interface RunnableEffect extends Effect {
  _run(): void
}

class EffectImpl<T extends PlainData = PlainData>
  implements Observer, RunnableEffect
{
  _status: ChangedStatus
  readonly _trigger: ObservableImpl<T>
  readonly _effectFunc: (value: T) => void
  constructor(trigger: ObservableImpl<T>, effectFunc: (value: T) => void) {
    this._status = DANGLING
    this._trigger = trigger
    this._effectFunc = effectFunc
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

  _run(): void {
    if (this._status !== SUSPENDED) {
      const current = this._trigger.current()
      if (this._status === DANGLING) {
        this._trigger._subscribe(this)
      } else if (this._status === CHANGED) {
        this._effectFunc(current)
      }
      this._status = NOT_CHANGED
    }
  }

  _schedule(): void {
    effectsQueue.push(this)
  }

  suspend(): void {
    assertIsNotInComputing("Suspending effect in compute function")

    if (this._status !== DANGLING) {
      this._trigger._unsubscribe(this)
    }
    this._status = SUSPENDED
  }

  resume(): void {
    assertIsNotInComputing("Resuming effect in compute function")

    if (this._status === SUSPENDED) {
      this._schedule()
      this._status = DANGLING
    }
  }

  _cleanup(): void {
    if (this._status === SUSPENDED) {
      this._trigger._unsubscribe(this)
    }
  }

  unsubscribe(): void {
    this._status = SUSPENDED
    cleanupQueue.push(this)
  }
}

let trackingSubscriber: ComputedImpl | null = null

let batchDepth = 0

let effectsQueue: RunnableEffect[] = []
let runningEffects: Array<RunnableEffect> = []
let cleanupQueue: Array<Observer> = []
let runningCleanup: Array<Observer> = []

const runQueues = (): void => {
  batchDepth++
  try {
    while (cleanupQueue.length > 0 || effectsQueue.length > 0) {
      if (cleanupQueue.length > 0) {
        const tmp = runningCleanup
        runningCleanup = cleanupQueue
        cleanupQueue = tmp
        for (const observer of runningCleanup) {
          observer._cleanup()
        }
        runningCleanup.length = 0
      }

      if (effectsQueue.length > 0) {
        const tmp = runningEffects
        runningEffects = effectsQueue
        effectsQueue = tmp
        for (const effect of runningEffects) {
          try {
            effect._run()
          } catch (e) {
            console.error(e)
          }
        }
        runningEffects.length = 0
      }
    }
  } finally {
    batchDepth--
  }
}

export const source = <T extends PlainData>(initValue: T): Source<T> => {
  assertIsNotInComputing("Creating source in compute function")

  return new SourceImpl<T>(initValue)
}

export const computed = <T extends PlainData>(func: () => T): Observable<T> => {
  assertIsNotInComputing("Creating computed in compute function")

  return new ComputedImpl(func)
}

const noop = () => {}

export const effect = <T extends PlainData>(
  trigger: Observable<T>,
  effectFunc: (value: T) => void = noop,
): Effect => {
  observableAssert(
    trigger instanceof ObservableImpl,
    "Trigger of effect is not observable",
  )
  assertIsNotInComputing("Creating effect in compute function")

  const res = new EffectImpl<T>(trigger as ObservableImpl<T>, effectFunc)
  if (batchDepth === 0) {
    runQueues()
  }
  return res
}

/**
 * Do some actions in batch and defer all effects to the end of batch.
 * If batch is called inside other batch, the effects will be deferred to the end of the root batch.
 *
 * @param func Function with mutations of source values in graph.
 * @returns The value func will return.
 */
export const batch = <T>(func: () => T): T => {
  assertIsNotInComputing("Starting batch in compute function")

  batchDepth++
  try {
    return func()
  } finally {
    batchDepth--
    if (batchDepth === 0) {
      runQueues()
    }
  }
}
