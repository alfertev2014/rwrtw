import { PlaceholderImpl } from './placeholder'

export enum PlaceType {
    Node,
    ParentNode,
    Placeholder,
    ParentPlaceholder,
}

export type DOMPlace =
    | { type: PlaceType.Node; node: Node }
    | { type: PlaceType.ParentNode; parent: Node }

export type Place =
    | DOMPlace
    | { type: PlaceType.Placeholder; placeholder: PlaceholderImpl }
    | { type: PlaceType.ParentPlaceholder; parent: PlaceholderImpl }

export const lastPlaceNode = (place: Place): DOMPlace => {
    switch (place.type) {
        case PlaceType.Placeholder:
            return lastPlaceNode(place.placeholder.lastPlace)
        case PlaceType.ParentPlaceholder:
            return lastPlaceNode(place.parent.place)
        default:
            return place
    }
}

export const renderNode = <T extends Node>(place: Place, node: T): T => {
    const domPlace = lastPlaceNode(place)
    if (domPlace.type === PlaceType.Node) {
        const domNode = domPlace.node
        if (domNode.parentNode) {
            return domNode.parentNode.insertBefore(node, domNode.nextSibling)
        } else {
            return node
        }
    } else {
        return domPlace.parent.appendChild(node)
    }
}

export const unrenderNodes = (place: Place, lastPlace: Place) => {
    const lastDomPlace: DOMPlace | null = lastPlaceNode(lastPlace)
    if (lastDomPlace && lastDomPlace.type === PlaceType.Node) {
        let lastDomNode: Node | null = lastDomPlace.node
        const firstDomPlace = place ? lastPlaceNode(place) : null
        const firstDomNode = firstDomPlace?.type === PlaceType.Node ? firstDomPlace.node : null
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
    if (lastDomPlace && lastDomPlace.type === PlaceType.Node) {
        let lastDomNode: Node | null = lastDomPlace.node
        const firstDomPlace = place ? lastPlaceNode(place) : null
        const firstDomNode = firstDomPlace?.type === PlaceType.Node ? firstDomPlace.node : null
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
