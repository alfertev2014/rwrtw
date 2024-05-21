
export interface ListModel<T> {
  readonly data: T[]

  removeItem: (i: number) => void
  moveItem: (from: number, to: number, element: T) => void
  insertItem: (i: number, element: T) => void

  applyNewData: (data: T[]) => void
}

export interface ListModelObserver<T> {
  onInsert?: (i: number, element: T) => void
  onMove?: (from: number, to: number) => void
  onRemove?: (i: number) => void
  onChanged?: (i: number, element: T) => void
}

class ListModelImpl<T> implements ListModel<T> {
  readonly data: T[]
  readonly elementsEquality?: (e1: T, e2: T) => boolean

  onInsert?: (i: number, element: T) => void
  onMove?: (from: number, to: number) => void
  onRemove?: (i: number) => void
  onChanged?: (i: number, element: T) => void

  constructor(initialData: T[], elementsEquality?: (e1: T, e2: T) => boolean) {
    this.data = [...initialData]
    this.elementsEquality = elementsEquality
  }

  applyNewData(newData: T[]): void {
    for (let i = 0; i < this.data.length; ) {
      const element = this.data[i]
      if (newData.findIndex((el) => this.elementsEquality?.(el, element) ?? el === element) < 0) {
        this.removeItem(i)
      } else {
        if (element !== newData[i]) {
          this.onChanged?.(i, element)
        }
        ++i
      }
    }

    for (let i = 0; i < newData.length; ++i) {
      const element = newData[i]
      const elementIndex = this.data.findIndex((el) => this.elementsEquality?.(el, element) ?? el === element)
      if (elementIndex >= 0) {
        this.moveItem(elementIndex, i, element)
      } else {
        this.insertItem(i, element)
      }
    }
  }

  removeItem(i: number): void {
    this.data.splice(i, 1)
    this.onRemove?.(i)
  }

  moveItem(from: number, to: number, element: T): void {
    this.data.splice(from, 1)
    this.data.splice(to, 0, element)
    this.onMove?.(from, to)
  }

  insertItem(i: number, element: T): void {
    this.data.splice(i, 0, element)
    this.onInsert?.(i, element)
  }
}

export const createDynamicList = <T>(initialData: T[], elementsEquality?: (e1: T, e2: T) => boolean): ListModel<T> => {
  return new ListModelImpl<T>(initialData, elementsEquality)
}