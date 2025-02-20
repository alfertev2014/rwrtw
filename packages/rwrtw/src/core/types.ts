import { Place, PlaceholderNode } from "./impl/place.js"

export interface Lifecycle {
  readonly mount?: () => void
  readonly unmount?: () => void
  readonly dispose?: () => void
}

export interface PlaceholderContext {
  readonly registerLifecycle: <L extends Lifecycle>(lifecycle: L) => L
}

export interface Renderer {
  readonly registerLifecycle: <L extends Lifecycle>(lifecycle: L) => L
  readonly insertNode: <T extends Node>(node: T) => T
  readonly insertPlaceholder: (content: PlaceholderContent) => Placeholder
  readonly insertList: (contents: PlaceholderContent[]) => PlaceholderList
  readonly lastPlace: Place
  readonly context: PlaceholderContext
  readonly createRendererAt: (place: Place) => Renderer
}

export type PlaceholderComponent = (renderer: Renderer) => void

export type PlaceholderContent = PlaceholderComponent | null

export interface Placeholder extends PlaceholderNode {
  readonly replaceContent: (content: PlaceholderContent) => void
}

export interface PlaceholderList extends PlaceholderNode {
  readonly length: number
  readonly insert: (index: number, content: PlaceholderContent) => void
  readonly removeAt: (index: number) => void
  readonly moveFromTo: (fromIndex: number, toIndex: number) => void
}
