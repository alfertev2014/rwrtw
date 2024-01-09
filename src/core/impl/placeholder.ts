import {
  type PlaceholderContext,
  type Lifecycle,
  type Placeholder,
  type PlaceholderContent,
  type PlaceholderList,
} from "../index.js"
import { ListImpl as PlaceholderListImpl } from "./list.js"
import { type DOMPlace, type Place, appendNodeAt, takeNodes, unrenderNodes, lastPlaceNode } from "./place.js"

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
      const context = new PlaceholderContextImpl(this._lifecycles, this._lastPlace)
      content(context)
      this._lastPlace = context._lastPlace
    }
  }

  erase(): void {
    this.unmount()
    this.dispose()
    unrenderNodes(this._place, this._lastPlace)
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
    const fragment = takeNodes(this._place, this._lastPlace)
    this._place = place
    appendNodeAt(this._place, fragment)
  }
}

export class PlaceholderContextImpl implements PlaceholderContext {
  _lifecycles: Lifecycle[]
  _lastPlace: Place
  constructor(lifecycles: Lifecycle[], lastPlace: Place) {
    this._lifecycles = lifecycles
    this._lastPlace = lastPlace
  }

  appendLifecycle<L extends Lifecycle>(lifecycle: L): L {
    this._lifecycles.push(lifecycle)
    return lifecycle
  }

  appendNode<N extends Node>(node: N): N {
    const res = appendNodeAt(this._lastPlace, node)
    this._lastPlace = res
    return res
  }

  appendPlaceholder(content: PlaceholderContent): Placeholder {
    const placeholder = new PlaceholderImpl(this._lastPlace, content)
    this._lifecycles.push(placeholder)
    this._lastPlace = placeholder
    return placeholder
  }

  appendList(contents: PlaceholderContent[]): PlaceholderList {
    const list = new PlaceholderListImpl(this._lastPlace, contents)
    this._lifecycles.push(list)
    this._lastPlace = list
    return list
  }

  appendComponent(content: PlaceholderContent): void {
    if (content != null) {
      content(this)
    }
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

  createComponentAt(place: Place, content: PlaceholderContent): Place {
    if (content != null) {
      const context = new PlaceholderContextImpl(this._lifecycles, place)
      content(context)
      return context._lastPlace
    } else {
      return place
    }
  }
}
