import { PlaceholderImpl } from "./impl"
import { type Lifecycle } from "./lifecycle"

import { type DOMPlace, type Place } from "./place"

export interface Placeholder extends Lifecycle {
  readonly place: Place
  erase: () => void
  setContent: (content: PlaceholderContent) => void
  spawnBefore: (content: PlaceholderContent) => Placeholder
  removeBefore: () => void
  moveToPlace: (place: Place) => void
  lastPlaceNode: () => DOMPlace
}

export type RegLifecycleHandler = (lifecycle: Lifecycle) => void

export type PlaceholderContent = ((place: Place, regLifecycle: RegLifecycleHandler) => Place) | null

export const createPlaceholder = (place: Place, content: PlaceholderContent): Placeholder =>
  new PlaceholderImpl(place, content)
