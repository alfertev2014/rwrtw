import { type PlaceholderList, type PlaceholderContent, type Lifecycle } from "../index.js"
import { type DOMPlace, type Place, lastPlaceNode } from "./place.js"
import { PlaceholderImpl } from "./placeholder.js"

export class ListImpl implements PlaceholderList, Lifecycle {
  readonly place: Place
  readonly elements: PlaceholderImpl[]
  constructor(place: Place, contents: PlaceholderContent[]) {
    this.place = place
    this.elements = []
    let currentPlace = place
    for (const content of contents) {
      const placeholder = new PlaceholderImpl(currentPlace, content)
      this.elements.push(placeholder)
      currentPlace = placeholder
    }
  }

  lastPlaceNode(): DOMPlace {
    return lastPlaceNode(this.lastPlace)
  }

  get lastPlace(): Place {
    if (this.elements.length > 0) {
      return this.elements[this.elements.length - 1]
    } else {
      return this.place
    }
  }

  _placeAtIndex(index: number): Place {
    return index > 0 ? this.elements[index - 1] : this.place
  }

  insert(index: number, content: PlaceholderContent): void {
    if (index > this.elements.length) {
      index = this.elements.length
    }
    const placeholder =
      index < this.elements.length
        ? this.elements[index].spawnBefore(content)
        : new PlaceholderImpl(this.lastPlace, content)
    this.elements.splice(index, 0, placeholder)
  }

  removeAt(index: number): void {
    if (index >= this.elements.length) {
      return
    }
    if (index >= 0 && index < this.elements.length - 1) {
      this.elements[index + 1].removeBefore()
    } else {
      this.elements[index].erase()
    }
    this.elements.splice(index, 1)
  }

  moveFromTo(fromIndex: number, toIndex: number): void {
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
      this.elements[toIndex + 1]._place = placeholder
    }
  }

  mount(): void {
    for (const element of this.elements) {
      element.mount?.()
    }
  }

  unmount(): void {
    for (const element of this.elements) {
      element.unmount?.()
    }
  }

  dispose(): void {
    for (const element of this.elements) {
      element.dispose?.()
    }
    this.elements.length = 0
  }
}
