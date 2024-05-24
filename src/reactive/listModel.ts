import { Observable, Source, source } from "./observable.js"

export interface ListModelObserver<T> {
  onInsert?: (i: number, element: Observable<T>) => void
  onMove?: (from: number, to: number) => void
  onRemove?: (i: number) => void
}

export interface ListModel<T> {
  readonly data: Observable<T>[]
  observer: ListModelObserver<T> | null

  removeItem: (i: number) => void
  moveItem: (from: number, to: number, element: T) => void
  insertItem: (i: number, element: T) => void

  applyNewData: (data: T[]) => void
}

class ListModelImpl<T> implements ListModel<T> {
  readonly _data: Source<T>[]
  observer: ListModelObserver<T> | null

  constructor(initialData: T[]) {
    this._data = initialData.map(item => source(item))
    this.observer = null
  }

  get data(): Observable<T>[] {
    return this._data
  }

  applyNewData(newData: T[]): void {
    for (let i = 0; i < this._data.length; ) {
      const element = this._data[i]
      if (newData.findIndex((el) => el === element) < 0) {
        this.removeItem(i)
      } else {
        element.change(newData[i])
        ++i
      }
    }

    for (let i = 0; i < newData.length; ++i) {
      const element = newData[i]
      const elementIndex = this._data.findIndex((el) => el === element)
      if (elementIndex >= 0) {
        this.moveItem(elementIndex, i, element)
      } else {
        this.insertItem(i, element)
      }
    }
  }

  removeItem(i: number): void {
    this._data.splice(i, 1)
    this.observer?.onRemove?.(i)
  }

  moveItem(from: number, to: number, element: T): void {
    const item = this._data[from]
    this._data.splice(from, 1)
    item.change(element)
    this._data.splice(to, 0, item)
    this.observer?.onMove?.(from, to)
  }

  insertItem(i: number, element: T): void {
    const item = source(element)
    this._data.splice(i, 0, item)
    this.observer?.onInsert?.(i, item)
  }
}

export const createDynamicList = <T>(initialData: T[]): ListModel<T> => {
  return new ListModelImpl<T>(initialData)
}