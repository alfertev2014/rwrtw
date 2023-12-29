import {
  type PlaceholderContext,
  type Lifecycle,
  type Placeholder,
  type PlaceholderContent,
  type PlaceholderList,
} from "../index.js"
import { ListImpl } from "./list.js"
import {
  type DOMPlace,
  type Place,
  PlaceholderNode,
  renderNode,
  takeNodes,
  unrenderNodes,
  ParentNodePlace,
} from "./place.js"

export class PlaceholderImpl extends PlaceholderNode implements Placeholder {
  _lifecycles: Lifecycle[]
  _place: Place
  _lastPlace: Place
  constructor(place: Place, content: PlaceholderContent) {
    super()
    this._lifecycles = []
    this._place = place
    this._lastPlace = place
    this._renderContent(content)
  }

  lastPlaceNode(): DOMPlace {
    if (this._lastPlace instanceof PlaceholderNode) {
      return this._lastPlace.lastPlaceNode()
    }
    return this._lastPlace
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
      const context = new PlaceholderContextImpl(this)
      // TODO: Handle exceptions
      content(context)
      this._lastPlace = context.place
    }
  }

  erase(): void {
    this.unmount()
    this.dispose()
    unrenderNodes(this._place, this._lastPlace)
    this._lastPlace = this._place
  }

  setContent(content: PlaceholderContent): void {
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

  swapWith(placeholder: PlaceholderImpl): void {
    const thisFragment = takeNodes(this._place, this._lastPlace)
    const otherFragment = takeNodes(placeholder._place, placeholder._lastPlace)
    const lifecycles = this._lifecycles
    const place = this._place
    const lastPlace = this._lastPlace
    this._lifecycles = placeholder._lifecycles
    this._place = placeholder._place
    this._lastPlace = placeholder._lastPlace
    placeholder._lifecycles = lifecycles
    placeholder._place = place
    placeholder._lastPlace = lastPlace
    renderNode(this._place, thisFragment)
    renderNode(placeholder._place, otherFragment)
  }

  moveToPlace(place: Place): void {
    const fragment = takeNodes(this._place, this._lastPlace)
    this._place = place
    renderNode(this._place, fragment)
  }
}

class PlaceholderContextImpl implements PlaceholderContext {
  readonly placeholder: PlaceholderImpl
  place: Place
  constructor(placeholder: PlaceholderImpl) {
    this.placeholder = placeholder
    this.place = placeholder._lastPlace
  }

  regLifecycle<L extends Lifecycle>(lifecycle: L): L {
    this.placeholder._lifecycles.push(lifecycle)
    return lifecycle
  }

  renderNode<N extends Node>(node: N): N {
    const res = renderNode(this.place, node)
    this.place = res
    return res
  }

  renderPlaceholder(content: PlaceholderContent): Placeholder {
    const placeholder = new PlaceholderImpl(this.placeholder._lastPlace, content)
    this.placeholder._lifecycles.push(placeholder)
    this.place = placeholder
    return placeholder
  }

  renderList(contents: PlaceholderContent[]): PlaceholderList {
    const list = new ListImpl(this.placeholder._lastPlace, contents)
    this.placeholder._lifecycles.push(list)
    this.placeholder._lastPlace = list
    return list
  }

  renderComponent(content: PlaceholderContent): void {
    if (content != null) {
      content(this)
    }
  }

  createChildContextAfter(node: Node): PlaceholderContext {
    const res = new PlaceholderContextImpl(this.placeholder)
    res.place = node
    return res
  }

  createChildContextIn(node: ParentNode): PlaceholderContext {
    const res = new PlaceholderContextImpl(this.placeholder)
    res.place = new ParentNodePlace(node)
    return res
  }
}
