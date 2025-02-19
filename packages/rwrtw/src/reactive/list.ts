import {
  assertIsNotInComputing,
  assertIsObservable,
  effect,
  Observable,
  observableAssert,
  ObservableImpl,
  Source,
} from "./observable.js"
import { PlainData } from "../types.js"

export interface ListObserver<T extends PlainData = PlainData> {
  onInsert: (i: number, element: T) => void
  onMove: (from: number, to: number) => void
  onRemove: (i: number) => void
  onReplace: (i: number, element: T) => void
}

export interface ListObservable<T extends PlainData = PlainData>
  extends Observable<readonly T[]> {
  observer: ListObserver<T> | null
}

export class ListObservableImpl<T extends PlainData = PlainData>
  extends ObservableImpl<readonly T[]>
  implements ListObservable<T>
{
  observer: ListObserver<T> | null = null
}

export interface ListSource<T extends PlainData = PlainData>
  extends ListObservable<T>,
    Source<readonly T[]> {
  readonly removeItem: (i: number) => void
  readonly moveItem: (from: number, to: number) => void
  readonly replaceItem: (i: number, element: T) => void
  readonly insertItem: (i: number, element: T) => void
}

export class ListSourceImpl<T extends PlainData = PlainData>
  extends ListObservableImpl<T>
  implements ListSource<T>
{
  override readonly _current: T[]
  _newData: readonly T[]

  constructor(initialData: readonly T[]) {
    super()
    this._newData = this._current = [...initialData]
  }

  change(newData: readonly T[]): void {
    assertIsNotInComputing("Changing list in compute function")

    if (newData !== this._newData) {
      this._newData = newData
      this._propagateChanged()
    }
  }

  override _recompute(): void {
    const newData = this._newData
    for (let i = 0; i < this._current.length; ) {
      const element = this._current[i]
      if (newData.findIndex((el) => el === element) < 0) {
        this._removeItem(i)
      } else {
        ++i
      }
    }

    for (let i = 0; i < newData.length; ++i) {
      const element = newData[i]
      const elementIndex = this._current.findIndex((el) => el === element)
      if (elementIndex >= 0) {
        if (elementIndex !== i) {
          this._moveItem(elementIndex, i)
        }
        this._replaceItem(i, element)
      } else {
        this._insertItem(i, element)
      }
    }
    this._newData = this._current
  }

  update(updater: (prev: readonly T[]) => readonly T[]): void {
    this.change(updater(this._current))
  }

  _removeItem(i: number): void {
    this._current.splice(i, 1)
    this.observer?.onRemove?.(i)
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
    this.observer?.onMove?.(from, to)
  }

  moveItem(from: number, to: number): void {
    assertIsNotInComputing("Moving item in list in compute function")

    if (from !== to) {
      this._moveItem(from, to)
      this._propagateChanged()
    }
  }

  _replaceItem(i: number, element: T): void {
    this._current[i] = element
    this.observer?.onReplace?.(i, element)
  }

  replaceItem(i: number, element: T): void {
    assertIsNotInComputing("Replacing item list in compute function")

    this._replaceItem(i, element)
    this._propagateChanged()
  }

  _insertItem(i: number, element: T): void {
    this._current.splice(i, 0, element)
    this.observer?.onInsert?.(i, element)
  }

  insertItem(i: number, element: T): void {
    assertIsNotInComputing("Inserting item into list in compute function")

    this._insertItem(i, element)
    this._propagateChanged()
  }
}

export const listSource = <T extends PlainData>(
  initialData: readonly T[],
): ListSource<T> => {
  assertIsNotInComputing("Creating list in compute function")

  return new ListSourceImpl<T>(initialData)
}

export const listTransform = <T extends PlainData, R extends PlainData>(
  source: ListObservable<T>,
  transformer: (item: T) => R,
): ListObservable<R> => {
  assertIsNotInComputing("Creating listTransform in compute function")
  observableAssert(
    source instanceof ListObservableImpl,
    "Expected observable list",
  )

  const list = listSource<R>(source.current().map(transformer))
  const observer: ListObserver<T> = {
    onInsert(i, element) {
      list.insertItem(i, transformer(element))
    },
    onMove(from, to) {
      list.moveItem(from, to)
    },
    onRemove(i) {
      list.removeItem(i)
    },
    onReplace(i, element) {
      list.replaceItem(i, transformer(element))
    },
  }
  source.observer = observer
  return list
}

export const listFromArray = <T extends PlainData>(
  observable: Observable<readonly T[]>,
): ListObservable<T> => {
  assertIsObservable(observable)

  const list = listSource(observable.current())
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
