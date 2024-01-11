import {
  type PlaceholderContext,
  type Lifecycle,
  type Placeholder,
  type PlaceholderContent,
  type PlaceholderList,
} from "../index.js"
import { ListImpl as PlaceholderListImpl } from "./list.js"
import { type DOMPlace, type Place, appendNodeAt, takeNodesFrom, removeNodesAt, lastPlaceNode } from "./place.js"

export class PlaceholderImpl implements Placeholder, Lifecycle {
  readonly _lifecycles: Lifecycle[]
  _place: Place
  _lastPlace: Place
  constructor(place: Place, content: PlaceholderContent) {
    this._lifecycles = []
    this._place = place
    this._lastPlace = place
    this._renderContent(content)
  }

  lastPlaceNode(): DOMPlace {
    return lastPlaceNode(this._lastPlace)
  }

  mount(): void {
    for (const c of this._lifecycles) {
      c.mount?.()
    }
  }

  unmount(): void {
    for (const c of this._lifecycles) {
      c.unmount?.()
    }
  }

  dispose(): void {
    for (const c of this._lifecycles) {
      c.dispose?.()
    }
    this._lifecycles.length = 0
  }

  _renderContent(content: PlaceholderContent): void {
    if (content != null) {
      // TODO: Handle exceptions
      this._lastPlace = content(this._lastPlace, this)
    }
  }

  erase(): void {
    this.unmount()
    this.dispose()
    removeNodesAt(this._place, this._lastPlace)
    this._lastPlace = this._place
  }

  replaceContent(content: PlaceholderContent): void {
    this.erase()
    // TODO: Use DocumentFragment
    this._renderContent(content)
    this.mount()
  }

  spawnBefore(content: PlaceholderContent): PlaceholderImpl {
    const spawned = new PlaceholderImpl(this._place, content)
    this._place = spawned
    return spawned
  }

  removeBefore(): void {
    if (this._place instanceof PlaceholderImpl) {
      this._place.erase()
      this._place = this._place._place
    }
  }

  moveToPlace(place: Place): void {
    const fragment = takeNodesFrom(this._place, this._lastPlace)
    this._place = place
    appendNodeAt(this._place, fragment)
  }

  appendLifecycle<L extends Lifecycle>(lifecycle: L): L {
    this._lifecycles.push(lifecycle)
    return lifecycle
  }

  createPlaceholderAt(place: Place, content: PlaceholderContent): Placeholder {
    const res = new PlaceholderImpl(place, content)
    this._lifecycles.push(res)
    return res
  }

  createListAt(place: Place, contents: PlaceholderContent[]): PlaceholderList {
    const res = new PlaceholderListImpl(place, contents)
    this._lifecycles.push(res)
    return res
  }
}
