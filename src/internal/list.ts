import { Lifecycle } from '../lifecycle'
import { Place, PlaceType } from './place'
import { PlaceholderImpl } from './placeholder'
import { ComponentFactory, Renderer } from './renderer'

export interface List extends Lifecycle {
    get lastPlace(): Place
    insert<T>(index: number, componentFunc: ComponentFactory<T>): void
    removeAt(index: number): void
}

export class ListImpl implements List {
    readonly place: Place
    readonly elements: PlaceholderImpl[]
    constructor(place: Place, componentFuncs: ComponentFactory[]) {
        this.place = place
        this.elements = []
        let index = 0
        for (const componentFunc of componentFuncs) {
            const placeholder = new PlaceholderImpl(
                index > 0
                    ? {
                          type: PlaceType.Placeholder,
                          placeholder: this.elements[index - 1],
                      }
                    : this.place
            )
            placeholder.renderContent(componentFunc)
            ++index
            this.elements.push(placeholder)
        }
    }

    get lastPlace(): Place {
        if (this.elements.length > 0) {
            return {
                type: PlaceType.Placeholder,
                placeholder: this.elements[this.elements.length - 1],
            }
        } else {
            return this.place
        }
    }

    insert<T>(index: number, componentFunc: ComponentFactory<T>) {
        if (index > this.elements.length) {
            index = this.elements.length
        }
        const placeholder = new PlaceholderImpl(
            index > 0
                ? {
                      type: PlaceType.Placeholder,
                      placeholder: this.elements[index - 1],
                  }
                : this.place
        )
        if (index < this.elements.length) {
            this.elements[index].place = { type: PlaceType.Placeholder, placeholder }
        }
        this.elements.splice(index, 0, placeholder)
        placeholder.setContent(componentFunc)
    }

    removeAt(index: number) {
        if (index >= this.elements.length) {
            return
        }
        if (index > 0 && index < this.elements.length - 1) {
            this.elements[index + 1].place = {
                type: PlaceType.Placeholder,
                placeholder: this.elements[index - 1],
            }
        }
        this.elements[index].setContent(null)
        this.elements.splice(index, 1)
    }

    moveFromTo(fromIndex: number, toIndex: number) {
        if (fromIndex === toIndex) {
            return
        }
        const placeholder = this.elements[fromIndex]

        if (fromIndex < toIndex) {
            for (let i = fromIndex; i < toIndex - 1; ++i) {
                this.elements[i] = this.elements[i + 1]
            }
        } else {
            for (let i = fromIndex; i > toIndex + 1; --i) {
                this.elements[i] = this.elements[i - 1]
            }
        }
        this.elements[toIndex] = placeholder

        placeholder.moveToPlace(
            toIndex === 0
                ? this.place
                : { type: PlaceType.Placeholder, placeholder: this.elements[toIndex - 1] }
        )
        if (toIndex < this.elements.length - 1) {
            this.elements[toIndex + 1].place = { type: PlaceType.Placeholder, placeholder }
        }
    }

    mount() {
        for (const element of this.elements) {
            element.mount()
        }
    }

    unmount() {
        for (const element of this.elements) {
            element.unmount()
        }
    }
}

export const list =
    (...componentFuncs: ComponentFactory[]): ComponentFactory<List> =>
    (renderer: Renderer) => renderer.renderList(componentFuncs)
