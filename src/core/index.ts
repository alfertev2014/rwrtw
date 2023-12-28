import { PlaceholderImpl } from "./impl/placeholder.js"

import { type DOMPlace, type Place } from "./impl/place.js"
import { ListImpl } from "./impl/list.js"

export {
  type DOMPlace,
  type Place,
  placeAfterNode,
  placeInParentNode,
  placeAfterPlaceholder,
  placeInParentPlaceholder,
} from "./impl/place.js"

export interface Lifecycle {
  readonly mount?: () => void
  readonly unmount?: () => void
  readonly dispose?: () => void
}

export interface Placeholder extends Lifecycle {
  readonly place: Place
  setContent: (content: PlaceholderContent) => void
  lastPlaceNode: () => DOMPlace
}

export type RegLifecycleHandler = (lifecycle: Lifecycle) => void

export type PlaceholderContent = ((place: Place, regLifecycle: RegLifecycleHandler) => Place) | null

export const createPlaceholder = (place: Place, content: PlaceholderContent): Placeholder =>
  new PlaceholderImpl(place, content)

export interface List extends Lifecycle {
  insert: (index: number, content: PlaceholderContent) => void
  removeAt: (index: number) => void
  moveFromTo: (fromIndex: number, toIndex: number) => void
  lastPlaceNode: () => DOMPlace
}

export const createList = (place: Place, contents: PlaceholderContent[]): List => new ListImpl(place, contents)