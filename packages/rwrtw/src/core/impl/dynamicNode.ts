import type {
  Lifecycle,
  DynamicNode,
  DynamicContent,
  RenderingContext,
  DynamicList,
  Renderer,
} from "../types.js"
import { createListAt } from "./dynamicList.js"
import {
  type DOMPlace,
  type Place,
  removeNodesAt,
  lastDOMPlaceOf,
  type DynamicFragment,
  insertNodeAt,
} from "./place.js"

class RendererImpl implements Renderer {
  _place: Place
  _context: RenderingContext
  constructor(place: Place, context: RenderingContext) {
    this._place = place
    this._context = context
  }

  get lastPlace(): Place {
    return this._place
  }

  get context(): RenderingContext {
    return this._context
  }

  registerLifecycle<L extends Lifecycle>(lifecycle: L): L {
    return this._context.registerLifecycle(lifecycle)
  }

  insertNode<T extends Node>(node: T): T {
    return (this._place = insertNodeAt(this._place, node))
  }

  insertDynamicNode(content: DynamicContent): DynamicNode {
    return (this._place = createChildDynamicNodeAt(
      this._place,
      this._context,
      content,
    ))
  }

  insertList(contents: DynamicContent[]): DynamicList {
    return (this._place = createListAt(this._place, this._context, contents))
  }

  createRendererAt(place: Place): Renderer {
    return new RendererImpl(place, this._context)
  }
}

export class ParentDynamicNodePlace implements DynamicFragment {
  parent: DynamicNodeImpl
  constructor(parent: DynamicNodeImpl) {
    this.parent = parent
  }

  lastDOMPlace(): DOMPlace {
    return lastDOMPlaceOf(this.parent._place)
  }
}

export class DynamicNodeImpl implements DynamicNode, Lifecycle {
  readonly _lifecycles: Lifecycle[]
  _place: Place
  _lastPlace: Place
  constructor(place: Place, content: DynamicContent) {
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

  _renderContent(content: DynamicContent): void {
    if (content != null) {
      const renderer = new RendererImpl(new ParentDynamicNodePlace(this), this)
      // TODO: Handle exceptions
      content(renderer)
      this._lastPlace = renderer.lastPlace
    }
  }

  erase(): void {
    this.unmount()
    removeNodesAt(this._place, this._lastPlace)
    this._lastPlace = this._place
  }

  replaceContent(content: DynamicContent): void {
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

export const createChildDynamicNodeAt = (
  place: Place,
  context: RenderingContext,
  content: DynamicContent,
): DynamicNode => {
  return context.registerLifecycle(new DynamicNodeImpl(place, content))
}

export const createRootDynamicNodeAt = (
  place: Place,
  content: DynamicContent,
): DynamicNode & Lifecycle => {
  return new DynamicNodeImpl(place, content)
}
