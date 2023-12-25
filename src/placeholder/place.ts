import { Placeholder } from "."

export class ParentNodePlace {
  parent: Node
  constructor(parent: Node) {
    this.parent = parent
  }
}

export type DOMPlace = Node | ParentNodePlace

export abstract class PlaceholderNode {
  abstract lastPlaceNode(): DOMPlace
}

export class ParentPlaceholderPlace extends PlaceholderNode {
  parent: Placeholder
  constructor(parent: Placeholder) {
    super()
    this.parent = parent
  }

  lastPlaceNode(): DOMPlace {
    return lastPlaceNode(this.parent.place)
  }
}

export type Place = DOMPlace | PlaceholderNode

export const lastPlaceNode = (place: Place): DOMPlace => {
  if (place instanceof PlaceholderNode) {
    return place.lastPlaceNode()
  } else {
    return place
  }
}

export const renderNode = <T extends Node>(place: Place, node: T): T => {
  const domPlace = lastPlaceNode(place)
  if (domPlace instanceof Node) {
    if (domPlace.parentNode) {
      return domPlace.parentNode.insertBefore(node, domPlace.nextSibling)
    } else {
      return node
    }
  } else {
    return domPlace.parent.appendChild(node)
  }
}

export const unrenderNodes = (place: Place, lastPlace: Place) => {
  const lastDomPlace: DOMPlace | null = lastPlaceNode(lastPlace)
  if (lastDomPlace && lastDomPlace instanceof Node) {
    let lastDomNode: Node | null = lastDomPlace
    const firstDomPlace = place ? lastPlaceNode(place) : null
    const firstDomNode = firstDomPlace instanceof Node ? firstDomPlace : null
    while (lastDomNode && lastDomNode !== firstDomNode) {
      const toRemove = lastDomNode
      lastDomNode = lastDomNode.previousSibling
      toRemove.parentNode?.removeChild(toRemove)
    }
  }
}

export const takeNodes = (place: Place, lastPlace: Place): DocumentFragment => {
  const lastDomPlace: DOMPlace | null = lastPlaceNode(lastPlace)
  const fragment = document.createDocumentFragment()
  if (lastDomPlace && lastDomPlace instanceof Node) {
    let lastDomNode: Node | null = lastDomPlace
    const firstDomPlace = place ? lastPlaceNode(place) : null
    const firstDomNode = firstDomPlace instanceof Node ? firstDomPlace : null
    while (lastDomNode && lastDomNode !== firstDomNode) {
      const toRemove = lastDomNode
      lastDomNode = lastDomNode.previousSibling
      if (toRemove.parentNode) {
        fragment.prepend(toRemove.parentNode.removeChild(toRemove))
      }
    }
  }
  return fragment
}
