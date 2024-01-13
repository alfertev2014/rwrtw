import { type PlaceholderList, type PlaceholderContent, type Lifecycle, type PlaceholderContext } from "../index.js"
import { type DOMPlace, type Place, lastPlaceNode, takeNodesFrom, insertNodeAt } from "./place.js"
import { PlaceholderImpl } from "./placeholder.js"

const spawnBefore = (placeholder: PlaceholderImpl, content: PlaceholderContent): PlaceholderImpl => {
  const spawned = new PlaceholderImpl(placeholder._place, content)
  placeholder._place = spawned
  return spawned
}

const moveToPlace = (placeholder: PlaceholderImpl, place: Place): void => {
  const fragment = takeNodesFrom(placeholder._place, placeholder._lastPlace)
  placeholder._place = place
  insertNodeAt(placeholder._place, fragment)
}

export class PlaceholderListImpl implements PlaceholderList, Lifecycle {
  readonly place: Place
  readonly items: PlaceholderImpl[]
  constructor(place: Place, contents: PlaceholderContent[]) {
    this.place = place
    this.items = []
    let currentPlace = place
    for (const content of contents) {
      const placeholder = new PlaceholderImpl(currentPlace, content)
      this.items.push(placeholder)
      currentPlace = placeholder
    }
  }

  lastPlaceNode(): DOMPlace {
    return lastPlaceNode(this.lastPlace)
  }

  get lastPlace(): Place {
    if (this.items.length > 0) {
      return this.items[this.items.length - 1]
    } else {
      return this.place
    }
  }

  _placeAtIndex(index: number): Place {
    return index > 0 ? this.items[index - 1] : this.place
  }

  insert(index: number, content: PlaceholderContent): void {
    if (index > this.items.length) {
      index = this.items.length
    }
    const placeholder =
      index < this.items.length ? spawnBefore(this.items[index], content) : new PlaceholderImpl(this.lastPlace, content)
    this.items.splice(index, 0, placeholder)
  }

  removeAt(index: number): void {
    if (index >= this.items.length) {
      return
    }
    if (index >= 0 && index < this.items.length - 1) {
      const next = this.items[index + 1]
      if (next._place instanceof PlaceholderImpl) {
        next._place.erase()
        next._place = next._place._place
      }
    } else {
      this.items[index].erase()
    }
    this.items.splice(index, 1)
  }

  moveFromTo(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) {
      return
    }
    const placeholder = this.items[fromIndex]
    if (fromIndex < this.items.length - 1) {
      this.items[fromIndex + 1]._place = placeholder._place
    }
    moveToPlace(placeholder, this.items[toIndex - 1])

    if (fromIndex < toIndex) {
      for (let i = fromIndex; i < toIndex - 1; ++i) {
        this.items[i] = this.items[i + 1]
      }
    } else {
      for (let i = fromIndex; i > toIndex + 1; --i) {
        this.items[i] = this.items[i - 1]
      }
    }
    this.items[toIndex] = placeholder

    if (toIndex < this.items.length - 1) {
      this.items[toIndex + 1]._place = placeholder
    }
  }

  mount(): void {
    for (const element of this.items) {
      element.mount()
    }
  }

  unmount(): void {
    for (const element of this.items) {
      element.unmount()
    }
  }

  dispose(): void {
    for (const element of this.items) {
      element.dispose()
    }
    this.items.length = 0
  }
}

export const createListAt = (
  place: Place,
  context: PlaceholderContext,
  contents: PlaceholderContent[],
): PlaceholderList => {
  return context.registerLifecycle(new PlaceholderListImpl(place, contents))
}
