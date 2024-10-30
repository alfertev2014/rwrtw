import { effect, Observable, Source, source } from "./observable.js"
import { PlainData } from "./types.js"

export interface ObjectObserver<T extends PlainData = PlainData> {
  onInsert?: (key: string | number, element: Observable<T>) => void
  onMove?: (from: string | number, to: string | number) => void
  onRemove?: (key: string | number) => void
}

export interface ObjectObservable<T extends PlainData = PlainData> {
  readonly data: {
    [key: string | number]: Observable<T>
  }
  observer: ObjectObserver<T> | null
}

export interface ObjectSource<T extends PlainData = PlainData> extends ObjectObservable<T> {
  removeItem: (key: string | number) => void
  moveItem: (from: string | number, to: string | number, element: T) => void
  insertItem: (key: string | number, element: T) => void

  change: (data: {
    [key: string | number]: T
  }) => void
}

export class ObjectSourceImpl<T extends PlainData = PlainData> implements ObjectSource<T> {
  readonly _data: {
    [key: string | number]: Source<T>
  }
  observer: ObjectObserver<T> | null

  constructor(initialData: {
    [key: string | number]: T
  }) {
    this._data = Object.fromEntries(Object.entries(initialData).map(([key, item]) => [key, source(item)]))
    this.observer = null
  }

  get data(): {
    [key: string | number]: Observable<T>
  } {
    return this._data
  }

  change(newData: {
    [key: string | number]: T
  }): void {
    for (const [key, element] of Object.entries(this._data)) {
      const newEntry = Object.entries(newData).find(([k, e]) => e === element.current())
      if (!newEntry) {
        this.removeItem(key)
      } else {
        element.change(newData[key])
      }
    }

    for (let i = 0; i < newData.length; ++i) {
      const element = newData[i]
      const elementIndex = this._data.findIndex((el) => el.current() === element)
      if (elementIndex >= 0) {
        this.moveItem(elementIndex, i, element)
      } else {
        this.insertItem(i, element)
      }
    }
  }

  removeItem(key: number | string): void {
    delete this._data[key]
    this.observer?.onRemove?.(key)
  }

  moveItem(from: string | number, to: string | number, element: T): void {
    const item = this._data[from]
    this._data.splice(from, 1)
    item.change(element)
    this._data.splice(to, 0, item)
    this.observer?.onMove?.(from, to)
  }

  insertItem(key: number | string, element: T): void {
    const item = source(element)
    this._data[key] = item
    this.observer?.onInsert?.(key, item)
  }
}

export const objectSource = <T extends PlainData>(initialData: {
  [key: string | number]: T
}): ObjectSource<T> => {
  return new ObjectSourceImpl<T>(initialData)
}

export const objectFromSource = <T extends PlainData>(
  observable: Observable<{
    [key: string | number]: T
  }>,
): ObjectObservable<T> => {
  const object = objectSource(observable.current())
  const e = effect(observable, (value) => {
    object.change(value)
  })
  e.suspend()
  return {
    get data() {
      return object.data
    },

    get observer() {
      return object.observer
    },

    set observer(observer) {
      object.observer = observer
      if (observer) {
        e.resume()
      } else {
        e.suspend()
      }
    },
  }
}
