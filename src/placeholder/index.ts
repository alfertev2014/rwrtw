import { PlaceholderImpl } from "./impl"
import { Lifecycle } from "./lifecycle"

import { DOMPlace, Place } from "./place"

export interface Placeholder extends Lifecycle {
  place: Place
  setContent(content: PlaceholderContent | null): void
  moveToPlace(place: Place): void
  lastPlaceNode(): DOMPlace
}

export type RegLifecycleHandler = (lifecycle: Lifecycle) => void

export type PlaceholderContent = (place: Place, regLifecycle: RegLifecycleHandler) => Place

export const createPlaceholder = (place: Place, content: PlaceholderContent | null): Placeholder =>
  new PlaceholderImpl(place, content)
