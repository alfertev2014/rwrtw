import { type PlaceholderList, type PlaceholderContent, type Lifecycle, type PlaceholderContext } from "../index.js"
import { type DOMPlace, type Place, lastDOMPlaceOf, takeNodesFrom, insertNodeAt } from "./place.js"
import { PlaceholderImpl } from "./placeholder.js"

const spawnBefore = (placeholder: PlaceholderImpl, content: PlaceholderContent): PlaceholderImpl => {
  const spawned = new PlaceholderImpl(placeholder._place, content)
  placeholder._place = spawned
  return spawned
}

export class PlaceholderListImpl implements PlaceholderList, Lifecycle {
  readonly _place: Place
  readonly _items: PlaceholderImpl[]
  constructor(place: Place, contents: PlaceholderContent[]) {
    this._place = place
    this._items = []
    let currentPlace = place
    for (const content of contents) {
      const placeholder = new PlaceholderImpl(currentPlace, content)
      this._items.push(placeholder)
      currentPlace = placeholder
    }
  }

  get length(): number {
    return this._items.length
  }

  lastDOMPlace(): DOMPlace {
    return lastDOMPlaceOf(this.lastPlace)
  }

  get lastPlace(): Place {
    if (this._items.length > 0) {
      return this._items[this._items.length - 1]
    } else {
      return this._place
    }
  }

  insert(index: number, content: PlaceholderContent): void {
    if (index > this._items.length) {
      index = this._items.length
    }
    const placeholder =
      index < this._items.length
        ? spawnBefore(this._items[index], content)
        : new PlaceholderImpl(this.lastPlace, content)
    this._items.splice(index, 0, placeholder)
  }

  removeAt(index: number): void {
    if (index >= this._items.length) {
      return
    }
    if (index >= 0 && index < this._items.length - 1) {
      const next = this._items[index + 1]
      if (next._place instanceof PlaceholderImpl) {
        next._place.erase()
        next._place = next._place._place
      }
    } else {
      this._items[index].erase()
    }
    this._items.splice(index, 1)
  }

  moveFromTo(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) {
      return
    }
    const placeholder = this._items[fromIndex]
    if (fromIndex < this._items.length - 1) {
      this._items[fromIndex + 1]._place = placeholder._place
    }
    
    const fragment = takeNodesFrom(placeholder._place, placeholder)
    const toPlace = fromIndex < toIndex ? this._items[toIndex] : this._items[toIndex]._place
    placeholder._place = toPlace
    insertNodeAt(toPlace, fragment)

    if (fromIndex < toIndex) {
      for (let i = fromIndex; i < toIndex; ++i) {
        this._items[i] = this._items[i + 1]
      }
    } else {
      for (let i = fromIndex; i > toIndex; --i) {
        this._items[i] = this._items[i - 1]
      }
    }
    this._items[toIndex] = placeholder

    if (toIndex < this._items.length - 1) {
      this._items[toIndex + 1]._place = placeholder
    }
  }

  mount(): void {
    for (const element of this._items) {
      element.mount()
    }
  }

  unmount(): void {
    for (const element of this._items) {
      element.unmount()
    }
  }

  dispose(): void {
    for (const element of this._items) {
      element.dispose()
    }
    this._items.length = 0
  }
}

export const createListAt = (
  place: Place,
  context: PlaceholderContext,
  contents: PlaceholderContent[],
): PlaceholderList => {
  return context.registerLifecycle(new PlaceholderListImpl(place, contents))
}
