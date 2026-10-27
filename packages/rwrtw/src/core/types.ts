import type { Place, DynamicFragment } from "./impl/place.js"

export interface Lifecycle {
  readonly mount?: () => void
  readonly unmount?: () => void
}

export interface RenderingContext {
  readonly registerLifecycle: <L extends Lifecycle>(lifecycle: L) => L
}

export interface Renderer {
  readonly registerLifecycle: <L extends Lifecycle>(lifecycle: L) => L
  readonly insertNode: <T extends Node>(node: T) => T
  readonly insertDynamicNode: (content: DynamicContent) => DynamicNode
  readonly insertList: (contents: DynamicContent[]) => DynamicList
  readonly lastPlace: Place
  readonly context: RenderingContext
  readonly createRendererAt: (place: Place) => Renderer
}

export type RenderableComponent = (renderer: Renderer) => void

export type DynamicContent = RenderableComponent | null

export interface DynamicNode extends DynamicFragment, RenderingContext {
  readonly replaceContent: (content: DynamicContent) => void
}

export interface DynamicList extends DynamicFragment {
  readonly length: number
  readonly insert: (index: number, content: DynamicContent) => void
  readonly removeAt: (index: number) => void
  readonly moveFromTo: (fromIndex: number, toIndex: number) => void
}
