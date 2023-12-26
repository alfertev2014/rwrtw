import { type Placeholder, type PlaceholderContent, type RegLifecycleHandler } from "."
import { type Lifecycle } from "./lifecycle"
import {
  type DOMPlace,
  type Place,
  PlaceholderNode,
  placeInParentPlaceholder,
  renderNode,
  takeNodes,
  unrenderNodes,
} from "./place"

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

  get place(): Place {
    return this._place
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

  _lifecyclesReg(): RegLifecycleHandler {
    return (lifecycle) => {
      this._lifecycles.push(lifecycle)
    }
  }

  _renderContent(content: PlaceholderContent): void {
    if (content != null) {
      this._lastPlace = content(placeInParentPlaceholder(this), this._lifecyclesReg())
    }
  }

  erase(): void {
    this.unmount()
    this.dispose()
    unrenderNodes(this._place, this._lastPlace)
  }

  setContent(content: PlaceholderContent): void {
    this.erase()
    this._lastPlace = this._place
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
