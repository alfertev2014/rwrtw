import type { ReactiveData, ReactiveValue } from "./types.js"

/**
 * Abstract signal node of reactive graph. Notifies its subscribers when stored value is changed.
 */
export interface Signal<out T extends ReactiveData = ReactiveData> {
  /**
   * Accessor for current value.
   *
   * Actualize current value if needed and remove changed sign from node.
   * If called in compute function or as a dependency of effect, the dependent node will subscribe on this signal.
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
 * Signal node is dangling and not connected to reactive graph.
 */
const DANGLING = -1

/**
 * Status of signal node in reactive graph.
 */
type ChangedStatus =
  | typeof NOT_CHANGED
  | typeof POSSIBLY_CHANGED
  | typeof CHANGED
  | typeof DANGLING

/**
 * Internal assertion error in reactive
 */
class SignalAssertionError extends Error {}

/**
 * Assert that condition is true.
 * Throw exception with message otherwise.
 *
 * @param condition Condition to check
 * @param message Error message if condition is not true
 */
export const signalAssert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new SignalAssertionError(message)
  }
}

/**
 * Assert that execution is not in a compute function.
 *
 * @param message Error message for exception
 */
export const assertIsNotInComputing = (
  message = "Doing something in compute function",
) => {
  signalAssert(trackingSubscriber === null, message)
}

export class SignalScope {
  parent: SignalScope | null
  depth: number
  effectsQueue: Observer[] = []
  effects: Effect[] = []
  children: Set<SignalScope> = new Set<SignalScope>()

  constructor(parent: SignalScope | null) {
    this.parent = parent
    this.depth = parent === null ? 0 : parent.depth + 1
    parent?.children.add(this)
  }

  _schedule(): void {
    if (this.effectsQueue.length === 0) {
      scopeQueue.push(this)
    }
  }

  scheduleEffect(effect: Observer): void {
    this._schedule()
    this.effectsQueue.push(effect)
  }

  runEffects(): void {
    while (this.effectsQueue.length > 0) {
      const tmp = runningEffects
      runningEffects = this.effectsQueue
      this.effectsQueue = tmp
      for (const effect of runningEffects) {
        effect._run()
      }
      runningEffects.length = 0
    }
    runCleanups()
  }

  cleanup(): void {
    for (const effect of this.effects) {
      effect.unsubscribe()
    }
    this.effects.length = 0
    for (const child of this.children) {
      child.cleanup()
    }
    this.children.clear()
    runCleanups()
  }

  runInScope<R>(func: () => R): R {
    const prevScope = currentScope
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    currentScope = this
    try {
      return func()
    } finally {
      currentScope = prevScope
    }
  }
}

export const createScope = () => {
  assertIsNotInComputing("Creating scope in compute function")

  return new SignalScope(currentScope)
}

/**
 * Reactive signal node to manage subscribers.
 */
export class SignalImpl<out T extends ReactiveData = ReactiveData>
  implements Signal<T>, Observer
{
  readonly _scope: SignalScope

  /**
   * Status of current value actuality
   */
  _status: ChangedStatus

  /**
   * Current stored value or last computed value.
   *
   * Not actual if this._status !== NOT_CHANGED.
   */
  _current: T | undefined

  /**
   * List of nodes that depends on this node.
   */
  readonly _subscribers: Set<Observer>

  constructor() {
    this._scope = currentScope
    this._status = DANGLING
    this._current = undefined
    this._subscribers = new Set()
  }

  _cleanup(): void {
    // do nothing
  }

  _run(): void {
    // do nothing
  }

  _schedule(): void {
    this._scope.scheduleEffect(this)
  }

  /**
   * @see Signal.current
   */
  current(): T {
    if (trackingSubscriber !== null) {
      trackingSubscriber._subscribeTo(this)
    }
    this._recompute()
    return this._current as T
  }

  /**
   * Set CHANGED state and propagate POSSIBLY_CHANGED recursively to subscribers.
   */
  _markChanged(): void {
    if (this._status !== CHANGED) {
      if (this._status !== POSSIBLY_CHANGED) {
        for (const subscriber of this._subscribers) {
          if (subscriber._scope !== this._scope) {
            subscriber._schedule()
          } else {
            subscriber._markPossiblyChanged()
          }
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
   * Recompute current value and clear changed sign.
   */
  _recompute(): void {
    if (this._status !== NOT_CHANGED) {
      this._status = NOT_CHANGED
      this._propagateChanged()
    }
  }

  /**
   * Add subscriber to this._subscribers set.
   *
   * @param subscriber Subscriber (effect or computed)
   */
  _subscribe(subscriber: Observer): void {
    this._subscribers.add(subscriber)
  }

  /**
   * Remove subscriber from this._subscribers set.
   *
   * @param subscriber Subscriber (effect or computed)
   */
  _unsubscribe(subscriber: Observer): void {
    this._subscribers.delete(subscriber)
    if (this._subscribers.size === 0) {
      this._onDangling()
    }
  }

  _onDangling(): void {
    // do nothing
  }

  _propagateChanged(): void {
    for (const subscriber of this._subscribers) {
      subscriber._markChanged()
    }
  }
}

/**
 * Check that value is Signal node
 * @param value Plain value or Signal node.
 * @returns True if value is Signal node.
 */
export const isSignal = <T extends ReactiveData = ReactiveData>(
  value: ReactiveData | Signal<T>,
): value is Signal<T> => value instanceof SignalImpl

/**
 * Assert that signal is Signal node
 * Throw exception with message otherwise.
 *
 * @param condition Condition to check
 * @param message Error message if condition is not true
 */
export const assertIsSignal = (
  signal: Signal,
  message = "Expected that object is Signal node",
) => {
  signalAssert(isSignal(signal), message)
}

interface Cleanup {
  readonly _cleanup: () => void
}

interface Observer extends Cleanup {
  readonly _markChanged: () => void
  readonly _markPossiblyChanged: () => void
  readonly _schedule: () => void
  readonly _run: () => void
  readonly _scope: SignalScope
}

/**
 * Reactive mutable source node for scalar value types
 */
export interface Source<
  T extends ReactiveData = ReactiveData,
> extends Signal<T> {
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
export class SourceImpl<T extends ReactiveData = ReactiveData>
  extends SignalImpl<T>
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
    assertIsNotInComputing("Changing source value in a compute function")

    if (value !== this._current) {
      batch(() => {
        this._propagateChanged()
        this._current = value
      })
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
 * Caches its current value if signal dependencies are not changed.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-empty-object-type
export interface Computed<
  out T extends ReactiveData = ReactiveData,
> extends Signal<T> {}

/**
 * @see Computed
 */
class ComputedImpl<out T extends ReactiveData = ReactiveData>
  extends SignalImpl<T>
  implements Computed<T>, Observer
{
  /**
   * Compute function to recompute current value. Required to be pure!
   */
  readonly _computeFunc: () => T

  /**
   * Signal dependencies needed to compute value ordered by occurrences in compute function body
   */
  readonly _deps: SignalImpl[]
  _depsCount: number

  constructor(computeFunc: () => T) {
    super()
    this._computeFunc = computeFunc
    this._deps = []
    this._depsCount = 0
  }

  override _run(): void {
    this._markPossiblyChanged()
  }

  /**
   * Add itself to set of subscribers of signal dependency.
   * Add the signal to list of dependencies if it is not already there.
   * Dependencies are collected to list in order of the method calls
   * Dependencies are merged with old dependencies.
   * Not actual old dependencies will bubble to tail of the list.
   *
   * @param dependency Signal dependency
   */
  _subscribeTo(dependency: SignalImpl): void {
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
   * @see Signal.recompute
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
    // eslint-disable-next-line @typescript-eslint/no-this-alias
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
      // Signal to all subscribers that the value was really changed
      for (const subscriber of this._subscribers) {
        subscriber._markChanged()
      }
    }
    this._status = NOT_CHANGED // The value is now in actual state
  }

  override _cleanup(): void {
    if (this._subscribers.size === 0) {
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

class StaticComputedImpl<
  out T extends ReactiveData = ReactiveData,
> extends ComputedImpl<T> {
  constructor(dependencies: SignalImpl[], computeFunc: () => T) {
    super(computeFunc)
    this._deps.push(...dependencies)
    this._depsCount = dependencies.length
  }

  override _recomputeDeps(): void {
    for (let i = 0; i < this._depsCount; ++i) {
      this._deps[i]._recompute()
      if (this._status === CHANGED) {
        return
      }
    }
    this._status = NOT_CHANGED
  }

  override _callComputeFunc(): void {
    const previousValue = this._current
    if (trackingSubscriber) {
      const prevTracking = trackingSubscriber
      trackingSubscriber = null // Don't track compute function. We are already know all the dependencies
      try {
        this._current = this._computeFunc()
      } finally {
        trackingSubscriber = prevTracking // restore previous compute function
      }
    } else {
      this._current = this._computeFunc()
    }
    if (this._current !== previousValue) {
      // Signal to all subscribers that the value was really changed
      for (const subscriber of this._subscribers) {
        subscriber._markChanged()
      }
    }
    this._status = NOT_CHANGED // The value is now in actual state
  }

  override _cleanup(): void {
    if (this._subscribers.size === 0) {
      for (const dependency of this._deps) {
        dependency._unsubscribe(this)
      }
      this._status = DANGLING
    }
  }
}

const dummyFunc = (): never => {
  throw new Error("Call dummy function")
}

class ConditionallyComputedImpl<
  out T extends ReactiveData = ReactiveData,
  out F extends ReactiveData = ReactiveData,
> extends ComputedImpl<T | F> {
  _condition: SignalImpl<boolean>
  _trueBranch: SignalImpl<T>
  _falseBranch: SignalImpl<F>
  _conditionValue: boolean | null
  constructor(
    condition: SignalImpl<boolean>,
    trueBranch: SignalImpl<T>,
    falseBranch: SignalImpl<F>,
  ) {
    super(dummyFunc)
    this._condition = condition
    this._trueBranch = trueBranch
    this._falseBranch = falseBranch
    this._conditionValue = null
  }

  override _recomputeDeps(): void {
    this._condition._recompute()
    if (this._status === CHANGED) {
      return
    }

    if (this._conditionValue) {
      this._trueBranch._recompute()
    } else {
      this._falseBranch._recompute()
    }

    if ((this._status as unknown) === CHANGED) {
      return
    }

    this._status = NOT_CHANGED
  }

  _callCondition(): T | F {
    const prevCondition = this._conditionValue
    this._conditionValue = this._condition.current()
    if (this._conditionValue !== prevCondition) {
      if (prevCondition === true) {
        this._trueBranch._unsubscribe(this)
      } else if (prevCondition === false) {
        this._falseBranch._unsubscribe(this)
      }
      if (this._conditionValue) {
        this._trueBranch._subscribe(this)
      } else {
        this._falseBranch._subscribe(this)
      }
    }
    return this._conditionValue
      ? this._trueBranch.current()
      : this._falseBranch.current()
  }

  override _callComputeFunc(): void {
    const previousValue = this._current
    if (trackingSubscriber) {
      const prevTracking = trackingSubscriber
      trackingSubscriber = null // Don't track compute function. We are already know all the dependencies
      try {
        this._current = this._callCondition()
      } finally {
        trackingSubscriber = prevTracking // restore previous compute function
      }
    } else {
      this._current = this._callCondition()
    }
    if (this._current !== previousValue) {
      // Signal to all subscribers that the value was really changed
      for (const subscriber of this._subscribers) {
        subscriber._markChanged()
      }
    }
    this._status = NOT_CHANGED // The value is now in actual state
  }

  override _cleanup(): void {
    if (this._subscribers.size === 0) {
      this._condition._unsubscribe(this)
      if (this._conditionValue) {
        this._trueBranch._unsubscribe(this)
      } else {
        this._falseBranch._unsubscribe(this)
      }
      this._conditionValue = null
      this._status = DANGLING
    }
  }
}

export interface Effect {
  readonly unsubscribe: () => void
}

class EffectImpl<T extends ReactiveData = ReactiveData>
  implements Observer, Effect
{
  readonly _scope: SignalScope
  _status: ChangedStatus
  readonly _trigger: SignalImpl<T>
  readonly _effectFunc: (value: T) => void
  constructor(trigger: SignalImpl<T>, effectFunc: (value: T) => void) {
    if (trigger._status !== NOT_CHANGED) {
      trigger._recompute()
    }
    trigger._subscribe(this)

    this._scope = currentScope
    this._status = NOT_CHANGED
    this._trigger = trigger
    this._effectFunc = effectFunc
    currentScope.effects.push(this)
  }

  _markChanged(): void {
    if (this._status !== CHANGED && this._status !== POSSIBLY_CHANGED) {
      this._schedule()
    }
    this._status = CHANGED
  }

  _markPossiblyChanged(): void {
    if (this._status !== CHANGED && this._status !== POSSIBLY_CHANGED) {
      this._schedule()
      this._status = POSSIBLY_CHANGED
    }
  }

  _run(): void {
    const current = this._trigger.current()
    if (this._status === DANGLING) {
      this._trigger._subscribe(this)
    } else if (this._status === CHANGED) {
      this._effectFunc(current)
    }
    this._status = NOT_CHANGED
  }

  _schedule(): void {
    this._scope.scheduleEffect(this)
  }

  _cleanup(): void {
    this._trigger._unsubscribe(this)
    this._status = DANGLING
  }

  unsubscribe(): void {
    this._cleanup()
  }
}

let trackingSubscriber: ComputedImpl | null = null

let batchDepth = 0
let runningEffects: Observer[] = []

let cleanupQueue: Observer[] = []
let runningCleanups: Observer[] = []

export const rootScope = new SignalScope(null)

let currentScope: SignalScope = rootScope

const runCleanups = (): void => {
  while (cleanupQueue.length > 0) {
    const tmp = runningCleanups
    runningCleanups = cleanupQueue
    cleanupQueue = tmp
    for (const observer of runningCleanups) {
      observer._cleanup()
    }
    runningCleanups.length = 0
  }
}

let scopeQueue: SignalScope[] = []
let runningScopes: SignalScope[] = []

const runScopes = (): void => {
  while (scopeQueue.length > 0) {
    const tmp = runningScopes
    runningScopes = scopeQueue
    scopeQueue = tmp
    runningScopes.sort((a, b) => a.depth - b.depth)

    for (const scope of runningScopes) {
      scope.runEffects()
    }

    runningScopes.length = 0
  }
}

export const source = <T extends ReactiveData>(initValue: T): Source<T> => {
  assertIsNotInComputing("Creating source in compute function")

  return new SourceImpl<T>(initValue)
}

export const computed = <T extends ReactiveData>(
  func: () => T,
): Signal<T> => {
  assertIsNotInComputing("Creating computed in compute function")

  return new ComputedImpl(func)
}

/**
 * Get current() of value if value is Signal. Returns value as is otherwise.
 * @param value Plain value or Signal node.
 * @returns Current value of Signal or value as is.
 */
export const currentOf = <T extends ReactiveData>(
  value: ReactiveValue<T>,
): T => (isSignal(value) ? value.current() : value)

export const staticComputed = <T extends ReactiveData>(
  dependencies: Signal[],
  func: () => T,
): Signal<T> => {
  assertIsNotInComputing("Creating staticComputed in compute function")

  signalAssert(
    dependencies.every((d) => d instanceof SignalImpl),
    "Some of dependencies are not SignalImpl",
  )

  return new StaticComputedImpl(dependencies as SignalImpl[], func)
}

export const condComputed = <T extends ReactiveData, F extends ReactiveData>(
  condition: Signal<boolean>,
  trueBranch: Signal<T>,
  falseBranch: Signal<F>,
): Signal<T | F> => {
  signalAssert(
    condition instanceof SignalImpl,
    "Condition is not signal",
  )
  signalAssert(
    trueBranch instanceof SignalImpl,
    "trueBranch is not signal",
  )
  signalAssert(
    falseBranch instanceof SignalImpl,
    "falseBranch is not signal",
  )

  return new ConditionallyComputedImpl(
    condition as SignalImpl<boolean>,
    trueBranch as unknown as SignalImpl<T>,
    falseBranch as unknown as SignalImpl<F>,
  )
}

export const effect = <T extends ReactiveData>(
  trigger: Signal<T>,
  effectFunc: (value: T) => void,
): Effect => {
  signalAssert(
    trigger instanceof SignalImpl,
    "Trigger of effect is not signal",
  )
  assertIsNotInComputing("Creating effect in compute function")

  return new EffectImpl<T>(trigger as SignalImpl<T>, effectFunc)
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
      runScopes()
    }
  }
}
