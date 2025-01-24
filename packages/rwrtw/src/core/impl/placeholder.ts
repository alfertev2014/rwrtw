import {
  type PlaceholderContext,
  type Lifecycle,
  type Placeholder,
  type PlaceholderContent,
  Renderer,
  createListAt,
  PlaceholderList,
} from "../index.js"
import {
  type DOMPlace,
  type Place,
  removeNodesAt,
  lastDOMPlaceOf,
  type PlaceholderNode,
  insertNodeAt,
} from "./place.js"

class RendererImpl implements Renderer {
  _place: Place
  _context: PlaceholderContext
  constructor(place: Place, context: PlaceholderContext) {
    this._place = place
    this._context = context
  }

  get lastPlace(): Place {
    return this._place
  }

  get context(): PlaceholderContext {
    return this._context
  }

  registerLifecycle<L extends Lifecycle>(lifecycle: L): L {
    return this._context.registerLifecycle(lifecycle)
  }

  insertNode<T extends Node>(node: T): T {
    return this._place = insertNodeAt(this._place, node)
  }

  insertPlaceholder(content: PlaceholderContent): Placeholder {
    return this._place = createChildPlaceholderAt(this._place, this._context, content)
  }

  insertList(contents: PlaceholderContent[]): PlaceholderList {
    return this._place = createListAt(this._place, this._context, contents)
  }

  createRendererAt(place: Place): Renderer {
    return new RendererImpl(place, this._context)
  }
}

export class ParentPlaceholderPlace implements PlaceholderNode {
  parent: PlaceholderImpl
  constructor(parent: PlaceholderImpl) {
    this.parent = parent
  }

  lastDOMPlace(): DOMPlace {
    return lastDOMPlaceOf(this.parent._place)
  }
}

export class PlaceholderImpl implements Placeholder, Lifecycle, PlaceholderContext {
  readonly _lifecycles: Lifecycle[]
  _place: Place
  _lastPlace: Place
  constructor(place: Place, content: PlaceholderContent) {
    this._lifecycles = []
    this._place = place
    this._lastPlace = place
    this._renderContent(content)
  }

  lastDOMPlace(): DOMPlace {
    return lastDOMPlaceOf(this._lastPlace)
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
      const renderer = new RendererImpl(new ParentPlaceholderPlace(this), this)
      // TODO: Handle exceptions
      content(renderer)
      this._lastPlace = renderer.lastPlace
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

export const createRootPlaceholderAt = (
  place: Place,
  content: PlaceholderContent,
): Placeholder & Lifecycle => {
  return new PlaceholderImpl(place, content)
}
