import { type PlaceholderContent } from "../placeholder"
import { type Lifecycle } from "../placeholder/lifecycle"
import { type DOMPlace, type Place } from "../placeholder/place"
import { ListImpl } from "./impl"

export interface List extends Lifecycle {
  insert: (index: number, content: PlaceholderContent) => void
  removeAt: (index: number) => void
  moveFromTo: (fromIndex: number, toIndex: number) => void
  lastPlaceNode: () => DOMPlace
}

export const createList = (place: Place, contents: PlaceholderContent[]): List => new ListImpl(place, contents)
