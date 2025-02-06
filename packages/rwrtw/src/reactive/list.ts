import {
  assertIsNotInComputing,
  effect,
  Observable,
  Source,
  source,
} from "./observable.js"
import { PlainData } from "../types.js"

export interface ListObserver<T extends PlainData = PlainData> {
  onInsert?: (i: number, element: Observable<T>) => void
  onMove?: (from: number, to: number) => void
  onRemove?: (i: number) => void
}

export interface ListObservable<T extends PlainData = PlainData> {
  readonly data: Observable<T>[]
  observer: ListObserver<T> | null
}

export interface ListSource<T extends PlainData = PlainData>
  extends ListObservable<T> {
  readonly data: Source<T>[]
  readonly removeItem: (i: number) => void
  readonly moveItem: (from: number, to: number) => void
  readonly replaceItem: (i: number, element: T) => void
  readonly insertItem: (i: number, element: T) => void

  readonly change: (data: T[]) => void
}

export class ListSourceImpl<T extends PlainData = PlainData>
  implements ListSource<T>
{
  readonly _data: Source<T>[]
  observer: ListObserver<T> | null

  constructor(initialData: T[]) {
    this._data = initialData.map((item) => source(item))
    this.observer = null
  }

  get data(): Source<T>[] {
    return this._data
  }

  change(newData: T[]): void {
    assertIsNotInComputing("Changing list in compute function")

    for (let i = 0; i < this._data.length; ) {
      const element = this._data[i]
      if (newData.findIndex((el) => el === element.current()) < 0) {
        this.removeItem(i)
      } else {
        ++i
      }
    }

    for (let i = 0; i < newData.length; ++i) {
      const element = newData[i]
      const elementIndex = this._data.findIndex(
        (el) => el.current() === element,
      )
      if (elementIndex >= 0) {
        if (elementIndex !== i) {
          this.moveItem(elementIndex, i)
        }
        this._data[i].change(element)
      } else {
        this.insertItem(i, element)
      }
    }
  }

  removeItem(i: number): void {
    assertIsNotInComputing("Removing item from list in compute function")

    this._data.splice(i, 1)
    this.observer?.onRemove?.(i)
  }

  moveItem(from: number, to: number): void {
    assertIsNotInComputing("Moving item in list in compute function")

    if (from !== to) {
      const item = this._data[from]
      this._data.splice(from, 1)
      this._data.splice(to, 0, item)
      this.observer?.onMove?.(from, to)
    }
  }

  replaceItem(i: number, element: T): void {
    assertIsNotInComputing("Replacing item list in compute function")

    this._data[i].change(element)
  }

  insertItem(i: number, element: T): void {
    assertIsNotInComputing("Inserting item into list in compute function")

    const item = source(element)
    this._data.splice(i, 0, item)
    this.observer?.onInsert?.(i, item)
  }
}

export const listSource = <T extends PlainData>(
  initialData: T[],
): ListSource<T> => {
  assertIsNotInComputing("Creating list in compute function")

  return new ListSourceImpl<T>(initialData)
}

export const listFromArray = <T extends PlainData>(
  observable: Observable<T[]>,
): ListObservable<T> => {
  const list = listSource(observable.current())
  const e = effect(observable, (value) => {
    list.change(value)
  })
  e.suspend()
  return {
    get data() {
      return list.data
    },

    get observer() {
      return list.observer
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
