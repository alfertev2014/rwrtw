import { type PlaceholderContext, type Lifecycle, type Placeholder, type PlaceholderContent } from "../index.js"
import { type DOMPlace, type Place, insertNodeAt, takeNodesFrom, removeNodesAt, lastPlaceNode } from "./place.js"

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

  registerLifecycle<L extends Lifecycle>(lifecycle: L): L {
    this._lifecycles.push(lifecycle)
    return lifecycle
  }
}

export const createChildPlaceholderAt = (
  place: Place,
  context: PlaceholderContext,
  content: PlaceholderContent,
): Placeholder => {
  return context.registerLifecycle(new PlaceholderImpl(place, content))
}

export const createRootPlaceholderAt = (place: Place, content: PlaceholderContent): Placeholder & Lifecycle => {
  return new PlaceholderImpl(place, content)
}
