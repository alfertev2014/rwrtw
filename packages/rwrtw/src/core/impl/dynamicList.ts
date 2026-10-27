import {
  type DynamicList,
  type DynamicContent,
  type Lifecycle,
  type RenderingContext,
} from "../types.js"
import {
  type DOMPlace,
  type Place,
  lastDOMPlaceOf,
  takeNodesFrom,
  insertNodeAt,
} from "./place.js"
import { DynamicNodeImpl } from "./dynamicNode.js"

const spawnBefore = (
  dynamicNode: DynamicNodeImpl,
  content: DynamicContent,
): DynamicNodeImpl => {
  const spawned = new DynamicNodeImpl(dynamicNode._place, content)
  dynamicNode._place = spawned
  return spawned
}

export class DynamicListImpl implements DynamicList, Lifecycle {
  readonly _place: Place
  readonly _items: DynamicNodeImpl[]
  constructor(place: Place, contents: DynamicContent[]) {
    this._place = place
    this._items = []
    let currentPlace = place
    for (const content of contents) {
      const dynamicNode = new DynamicNodeImpl(currentPlace, content)
      this._items.push(dynamicNode)
      currentPlace = dynamicNode
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

  insert(index: number, content: DynamicContent): void {
    if (index > this._items.length) {
      index = this._items.length
    }
    const dynamicNode =
      index < this._items.length
        ? spawnBefore(this._items[index], content)
        : new DynamicNodeImpl(this.lastPlace, content)
    this._items.splice(index, 0, dynamicNode)
  }

  removeAt(index: number): void {
    if (index >= this._items.length) {
      return
    }
    if (index >= 0 && index < this._items.length - 1) {
      const next = this._items[index + 1]
      if (next._place instanceof DynamicNodeImpl) {
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
    const dynamicNode = this._items[fromIndex]
    if (fromIndex < this._items.length - 1) {
      this._items[fromIndex + 1]._place = dynamicNode._place
    }

    const fragment = takeNodesFrom(dynamicNode._place, dynamicNode)
    const toPlace =
      fromIndex < toIndex ? this._items[toIndex] : this._items[toIndex]._place
    dynamicNode._place = toPlace
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
    this._items[toIndex] = dynamicNode

    if (toIndex < this._items.length - 1) {
      this._items[toIndex + 1]._place = dynamicNode
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
}

export const createListAt = (
  place: Place,
  context: RenderingContext,
  contents: DynamicContent[],
): DynamicList => {
  return context.registerLifecycle(new DynamicListImpl(place, contents))
}
