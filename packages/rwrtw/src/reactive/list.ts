import {
  assertIsNotInComputing,
  assertIsObservable,
  effect,
  type Observable,
  ObservableImpl,
  source,
  type Source,
} from "./observable.js"
import type { MutableReactivePlainData, ReactivePlainData } from "./types.js"

export interface ListObserver<T extends ReactivePlainData = ReactivePlainData> {
  onInsert: (i: number, element: Observable<T>) => void
  onMove: (from: number, to: number) => void
  onRemove: (i: number) => void
}

export interface ListObservable<
  T extends ReactivePlainData = ReactivePlainData,
> extends Observable<readonly Observable<T>[]> {
  observer: ListObserver<T> | null
}

export class ListObservableImpl<T extends ReactivePlainData = ReactivePlainData>
  extends ObservableImpl<readonly Observable<T>[]>
  implements ListObservable<T>
{
  observer: ListObserver<T> | null = null
}

export const isListObservable = <
  T extends ReactivePlainData = ReactivePlainData,
>(
  list: readonly T[] | ListObservable<T>,
): list is ListObservable<T> => list instanceof ListObservableImpl

export interface ListSource<
  T extends MutableReactivePlainData = MutableReactivePlainData,
> extends ListObservable<T> {
  readonly removeItem: (i: number) => void
  readonly moveItem: (from: number, to: number) => void
  readonly insertItem: (i: number, element: T) => void
  readonly current: () => readonly Source<T>[]
  readonly change: (newData: readonly T[]) => void
}

export class ListSourceImpl<
  T extends MutableReactivePlainData = MutableReactivePlainData,
>
  extends ListObservableImpl<T>
  implements ListSource<T>
{
  override readonly _current: Source<T>[]

  override current(): readonly Source<T>[] {
    return this._current
  }

  constructor(initialData: readonly T[]) {
    super()
    this._current = initialData.map((item) => source(item))
  }

  change(newData: readonly T[]): void {
    assertIsNotInComputing("Changing list in compute function")

    for (let i = 0; i < this._current.length; ) {
      const element = this._current[i]
      if (newData.findIndex((el) => el === element.current()) < 0) {
        this._removeItem(i)
      } else {
        ++i
      }
    }

    for (let i = 0; i < newData.length; ++i) {
      const element = newData[i]
      const elementIndex = this._current.findIndex(
        (el) => el.current() === element,
      )
      if (elementIndex >= 0) {
        if (elementIndex !== i) {
          this._moveItem(elementIndex, i)
        }
        this._current[i].change(element)
      } else {
        this._insertItem(i, element)
      }
    }
    this._propagateChanged()
  }

  update(updater: (prev: readonly Observable<T>[]) => readonly T[]): void {
    this.change(updater(this._current))
  }

  _removeItem(i: number): void {
    this._current.splice(i, 1)
    this.observer?.onRemove(i)
  }

  removeItem(i: number): void {
    assertIsNotInComputing("Removing item from list in compute function")

    this._removeItem(i)
    this._propagateChanged()
  }

  _moveItem(from: number, to: number): void {
    const item = this._current[from]
    this._current.splice(from, 1)
    this._current.splice(to, 0, item)
    this.observer?.onMove(from, to)
  }

  moveItem(from: number, to: number): void {
    assertIsNotInComputing("Moving item in list in compute function")

    if (from !== to) {
      this._moveItem(from, to)
      this._propagateChanged()
    }
  }

  _insertItem(i: number, element: T): void {
    const s = source(element)
    this._current.splice(i, 0, s)
    this.observer?.onInsert(i, s)
  }

  insertItem(i: number, element: T): void {
    assertIsNotInComputing("Inserting item into list in compute function")

    this._insertItem(i, element)
    this._propagateChanged()
  }
}

export const listSource = <T extends MutableReactivePlainData>(
  initialData: readonly T[],
): ListSource<T> => {
  assertIsNotInComputing("Creating list in compute function")

  return new ListSourceImpl<T>(initialData)
}

export const listFromArray = <T extends MutableReactivePlainData>(
  observable: Observable<readonly T[]>,
): ListObservable<T> => {
  assertIsObservable(observable)

  const list = new ListSourceImpl<T>(observable.current())
  const e = effect(observable, (value) => {
    list.change(value)
  })
  e.suspend()
  return {
    get observer() {
      return list.observer
    },

    current() {
      return list.current()
    },

    set observer(observer) {
      list.observer = observer
      if (observer) {
        e.resume()
      } else {
        e.suspend()
      }
    },
  }
}
