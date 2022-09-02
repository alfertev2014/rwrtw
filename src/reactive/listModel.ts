export const defaultElementsEquality = <T>(e1: T, e2: T) => {
    return e1 === e2
}

export class ListModel<T> {
    readonly data: T[]
    readonly elementsEquality: (e1: T, e2: T) => boolean

    onAdd?: (i: number, element: T) => void
    onMove?: (from: number, to: number, element: T) => void
    onRemove?: (i: number) => void

    constructor(data: T[], elementsEquality = defaultElementsEquality) {
        this.data = [...data]
        this.elementsEquality = elementsEquality
    }

    applyNewData(data: T[]) {
        for (let i = 0; i < this.data.length; ) {
            const element = this.data[i]
            if (data.findIndex((el) => this.elementsEquality(el, element)) < 0) {
                this._removeElement(i)
            } else {
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

    _findElement(element: T) {
        return this.data.findIndex((el) => this.elementsEquality(el, element))
    }

    _removeElement(i: number) {
        this.data.splice(i, 1)
        this.onRemove?.(i)
    }

    _moveElement(from: number, to: number, element: T) {
        this.data.splice(from, 1)
        this.data.splice(to, 0, element)
        this.onMove?.(from, to, element)
    }

    _insertElement(i: number, element: T) {
        this.data.splice(i, 0, element)
        this.onAdd?.(i, element)
    }
}
