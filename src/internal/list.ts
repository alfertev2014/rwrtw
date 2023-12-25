import { Placeholder, PlaceholderContent, createPlaceholder } from '../placeholder'
import { Lifecycle } from '../placeholder/lifecycle'
import { DOMPlace, Place, PlaceholderNode, lastPlaceNode } from '../placeholder/place'

export interface List {
    insert(index: number, content: PlaceholderContent): void
    removeAt(index: number): void
    moveFromTo(fromIndex: number, toIndex: number): void
}

export class ListImpl extends PlaceholderNode implements List, Lifecycle {
    readonly place: Place
    readonly elements: Placeholder[]
    constructor(place: Place, contents: (PlaceholderContent | null)[]) {
        super()
        this.place = place
        this.elements = []
        let index = 0
        for (const content of contents) {
            const placeholder = createPlaceholder(
                index > 0 ? this.elements[index - 1] : this.place,
                content,
            )
            ++index
            this.elements.push(placeholder)
        }
    }

    lastPlaceNode(): DOMPlace {
        const place = this.lastPlace
        return lastPlaceNode(place)
    }

    get lastPlace(): Place {
        if (this.elements.length > 0) {
            return this.elements[this.elements.length - 1]
        } else {
            return this.place
        }
    }

    insert(index: number, content: PlaceholderContent | null) {
        if (index > this.elements.length) {
            index = this.elements.length
        }
        const placeholder = createPlaceholder(
            index > 0 ? this.elements[index - 1] : this.place,
            content,
        )
        if (index < this.elements.length) {
            this.elements[index].place = placeholder
        }
        this.elements.splice(index, 0, placeholder)
    }

    removeAt(index: number) {
        if (index >= this.elements.length) {
            return
        }
        if (index > 0 && index < this.elements.length - 1) {
            this.elements[index + 1].place = this.elements[index - 1]
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

        placeholder.moveToPlace(toIndex === 0 ? this.place : this.elements[toIndex - 1])
        if (toIndex < this.elements.length - 1) {
            this.elements[toIndex + 1].place = placeholder
        }
    }

    mount() {
        for (const element of this.elements) {
            element.mount?.()
        }
    }

    unmount() {
        for (const element of this.elements) {
            element.unmount?.()
        }
    }
}
