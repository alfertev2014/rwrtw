import { type PlaceholderNode, type Place } from "./impl/place.js"

export {
  type DOMPlace,
  placeAtBeginingOf,
  type PlaceholderNode,
  type Place,
  insertNodeAt as appendNodeAt,
} from "./impl/place.js"
export { createRootPlaceholderAt, createChildPlaceholderAt } from "./impl/placeholder.js"
export { createListAt } from "./impl/list.js"

export interface Lifecycle {
  readonly mount?: () => void
  readonly unmount?: () => void
  readonly dispose?: () => void
}

export interface PlaceholderContext {
  readonly registerLifecycle: <L extends Lifecycle>(lifecycle: L) => L
}

export type PlaceholderComponent = (place: Place, context: PlaceholderContext) => Place

export type PlaceholderContent = PlaceholderComponent | null

export interface Placeholder extends PlaceholderNode {
  readonly replaceContent: (content: PlaceholderContent) => void
}

export interface PlaceholderList extends PlaceholderNode {
  readonly insert: (index: number, content: PlaceholderContent) => void
  readonly removeAt: (index: number) => void
  readonly moveFromTo: (fromIndex: number, toIndex: number) => void
}
