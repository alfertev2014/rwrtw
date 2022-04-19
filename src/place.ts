import { Placeholder } from './component'

export type DOMPlace = Node | { parent: Node }

export type Place = DOMPlace | Placeholder

export const lastPlaceNode = (place: Place): DOMPlace => {
    if (place instanceof Placeholder) {
        return lastPlaceNode(place.lastPlace)
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
    let domPlace: DOMPlace | null = lastPlaceNode(lastPlace)
    if (domPlace instanceof Node) {
        const firstDomPlace = place ? lastPlaceNode(place) : null
        const firstNode = firstDomPlace instanceof Node ? firstDomPlace : null
        while (domPlace && domPlace !== firstNode) {
            const toRemove = domPlace
            domPlace = domPlace.previousSibling
            toRemove.parentNode?.removeChild(toRemove)
        }
    }
}
