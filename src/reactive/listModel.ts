export const defaultElementsEquality = <T>(e1: T, e2: T): boolean => {
  return e1 === e2
}

export class ListModel<T> {
  readonly data: T[]
  readonly elementsEquality: (e1: T, e2: T) => boolean

  onInsert?: (i: number, element: T) => void
  onMove?: (from: number, to: number) => void
  onRemove?: (i: number) => void
  onChanged?: (i: number, element: T) => void

  constructor(data: T[], elementsEquality = defaultElementsEquality) {
    this.data = [...data]
    this.elementsEquality = elementsEquality
  }

  applyNewData(data: T[]): void {
    for (let i = 0; i < this.data.length; ) {
      const element = this.data[i]
      if (data.findIndex((el) => this.elementsEquality(el, element)) < 0) {
        this._removeElement(i)
      } else {
        this.onChanged?.(i, element)
        ++i
      }
    }

    for (let i = 0; i < data.length; ++i) {
      const element = data[i]
      const elementIndex = this._findElement(element)
      if (elementIndex >= 0) {
        this._moveElement(elementIndex, i, element)
      } else {
        this._insertElement(i, element)
      }
    }
  }

  _findElement(element: T): number {
    return this.data.findIndex((el) => this.elementsEquality(el, element))
  }

  _removeElement(i: number): void {
    this.data.splice(i, 1)
    this.onRemove?.(i)
  }

  _moveElement(from: number, to: number, element: T): void {
    this.data.splice(from, 1)
    this.data.splice(to, 0, element)
    this.onMove?.(from, to)
  }

  _insertElement(i: number, element: T): void {
    this.data.splice(i, 0, element)
    this.onInsert?.(i, element)
  }
}
