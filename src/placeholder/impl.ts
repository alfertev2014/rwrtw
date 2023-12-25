import { Placeholder, PlaceholderContent, RegLifecycleHandler } from "."
import { Lifecycle } from "./lifecycle"
import { DOMPlace, ParentPlaceholderPlace, Place, PlaceholderNode, renderNode, takeNodes, unrenderNodes } from "./place"

export class PlaceholderImpl extends PlaceholderNode implements Placeholder {
  lifecycles: Lifecycle[]
  place: Place
  lastPlace: Place
  constructor(place: Place, content: PlaceholderContent | null) {
      super()
      this.lifecycles = []
      this.place = place
      this.lastPlace = place
      this.renderContent(content)
  }

  lastPlaceNode(): DOMPlace {
      if (this.lastPlace instanceof PlaceholderNode) {
          return this.lastPlace.lastPlaceNode()
      }
      return this.lastPlace
  }

  mount() {
      for (const c of this.lifecycles) {
              c.mount?.()
      }
  }

  unmount() {
      for (const c of this.lifecycles) {
              c.unmount?.()
      }
  }

  dispose() {
    for (const c of this.lifecycles) {
        c.dispose?.()
    }
    this.lifecycles.length = 0
  }

  _lifecyclesReg(): RegLifecycleHandler {
      return (lifecycle) => {
          this.lifecycles.push(lifecycle)
      }
  }

  renderContent(content: PlaceholderContent | null) {
      if (content) {
          this.lastPlace = content(
              new ParentPlaceholderPlace(this),
              this._lifecyclesReg()
          )
      }
  }

  setContent(content: PlaceholderContent | null) {
      this.unmount()
      this.dispose()
      unrenderNodes(this.place, this.lastPlace)
      this.lastPlace = this.place
      this.renderContent(content)
      this.mount()
  }

  spawnBefore(content: PlaceholderContent | null): Placeholder {
      const spawned = new PlaceholderImpl(this.place, content)
      this.place = spawned
      return spawned
  }

  spawnAfter(content: PlaceholderContent | null): Placeholder {
      const spawned = new PlaceholderImpl(this.place, null)
      spawned.lifecycles = this.lifecycles
      spawned.lastPlace = this.lastPlace
      this.place = spawned
      this.lastPlace = this.place
      this.lifecycles = []
      this.renderContent(content)
      return spawned
  }

  swapWith(placeholder: PlaceholderImpl) {
      const thisFragment = takeNodes(this.place, this.lastPlace)
      const otherFragment = takeNodes(placeholder.place, placeholder.lastPlace)
      const lifecycles = this.lifecycles
      const place = this.place
      const lastPlace = this.lastPlace
      this.lifecycles = placeholder.lifecycles
      this.place = placeholder.place
      this.lastPlace = placeholder.lastPlace
      placeholder.lifecycles = lifecycles
      placeholder.place = place
      placeholder.lastPlace = lastPlace
      renderNode(this.place, thisFragment)
      renderNode(placeholder.place, otherFragment)
  }

  moveToPlace(place: Place) {
      const fragment = takeNodes(this.place, this.lastPlace)
      this.place = place
      renderNode(this.place, fragment)
  }
}