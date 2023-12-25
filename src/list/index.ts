import { PlaceholderContent } from "../placeholder"
import { Lifecycle } from "../placeholder/lifecycle"
import { DOMPlace, Place } from "../placeholder/place"
import { ListImpl } from "./impl"

export interface List extends Lifecycle {
  insert(index: number, content: PlaceholderContent | null): void
  removeAt(index: number): void
  moveFromTo(fromIndex: number, toIndex: number): void
  lastPlaceNode(): DOMPlace
}

export const createList = (place: Place, contents: (PlaceholderContent | null)[]): List => new ListImpl(place, contents)
