import {
  assertIsNotInComputing,
  batch,
  type Signal,
  SignalImpl,
  source,
  type Source,
} from "./signal.js"
import type { ReactiveData } from "./types.js"

export interface ListObserver<T extends ReactiveData = ReactiveData> {
  onInsert: (i: number, item: Signal<T>) => void
  onMove: (from: number, to: number) => void
  onRemove: (i: number) => void
}

export interface ListSignal<
  T extends ReactiveData = ReactiveData,
> extends Signal<readonly Signal<T>[]> {
  registerObserver: (observer: ListObserver<T>) => void
  unregisterObserver: (observer: ListObserver<T>) => void
}

export class ListSignalImpl<T extends ReactiveData = ReactiveData>
  extends SignalImpl<readonly Signal<T>[]>
  implements ListSignal<T>
{
  _observers: ListObserver<T>[] = []

  registerObserver(observer: ListObserver<T>): void {
    if (!this._observers.includes(observer)) {
      this._observers.push(observer)
    }
  }

  unregisterObserver(observer: ListObserver<T>): void {
    const index = this._observers.indexOf(observer)
    if (index >= 0) {
      this._observers.splice(index, 1)
    }
  }
}

export const isListSignal = <T extends ReactiveData = ReactiveData>(
  list: readonly T[] | ListSignal<T>,
): list is ListSignal<T> => list instanceof ListSignalImpl

export interface ListSource<
  T extends ReactiveData = ReactiveData,
> extends ListSignal<T> {
  readonly removeItem: (i: number) => void
  readonly moveItem: (from: number, to: number) => void
  readonly insertItem: (i: number, item: T) => void
  readonly current: () => readonly Source<T>[]
  readonly change: (newData: readonly T[]) => void
}

export class ListSourceImpl<T extends ReactiveData = ReactiveData>
  extends ListSignalImpl<T>
  implements ListSource<T>
{
  override readonly _current: Source<T>[]

  override current(): readonly Source<T>[] {
    return super.current() as readonly Source<T>[]
  }

  constructor(initialData: readonly T[]) {
    super()
    this._current = initialData.map((item) => source(item))
  }

  _change(newData: readonly T[]): void {
    for (let i = 0; i < this._current.length;) {
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
  }

  change(newData: readonly T[]): void {
    assertIsNotInComputing("Changing list in compute function")

    batch(() => {
      this._change(newData)
      this._markChanged()
    })
  }

  update(updater: (prev: readonly Signal<T>[]) => readonly T[]): void {
    this.change(updater(this._current))
  }

  _removeItem(i: number): void {
    this._current.splice(i, 1)
    this._observers.forEach((o) => {
      o.onRemove(i)
    })
  }

  removeItem(i: number): void {
    assertIsNotInComputing("Removing item from list in compute function")

    batch(() => {
      this._removeItem(i)
      this._markChanged()
    })
  }

  _moveItem(from: number, to: number): void {
    const item = this._current[from]
    this._current.splice(from, 1)
    this._current.splice(to, 0, item)
    this._observers.forEach((o) => {
      o.onMove(from, to)
    })
  }

  moveItem(from: number, to: number): void {
    assertIsNotInComputing("Moving item in list in compute function")

    if (from !== to) {
      batch(() => {
        this._moveItem(from, to)
        this._markChanged()
      })
    }
  }

  _insertItem(i: number, item: T): void {
    const s = source(item)
    this._current.splice(i, 0, s)
    this._observers.forEach((o) => {
      o.onInsert(i, s)
    })
  }

  insertItem(i: number, item: T): void {
    assertIsNotInComputing("Inserting item into list in compute function")

    batch(() => {
      this._insertItem(i, item)
      this._markChanged()
    })
  }
}

export const listSource = <T extends ReactiveData>(
  initialData: readonly T[],
): ListSource<T> => {
  assertIsNotInComputing("Creating list in compute function")

  return new ListSourceImpl<T>(initialData)
}
