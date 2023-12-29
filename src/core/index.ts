import { PlaceholderImpl } from "./impl/placeholder.js"

import { ParentNodePlace } from "./impl/place.js"

export interface Lifecycle {
  readonly mount?: () => void
  readonly unmount?: () => void
  readonly dispose?: () => void
}

export type RegLifecycleHandler = (lifecycle: Lifecycle) => void

export interface PlaceholderContext {
  readonly regLifecycle: <L extends Lifecycle>(lifecycle: L) => L
  readonly renderNode: <N extends Node>(node: N) => N
  readonly renderPlaceholder: (content: PlaceholderContent) => Placeholder
  readonly renderList: (contents: PlaceholderContent[]) => PlaceholderList
  readonly renderComponent: (content: PlaceholderContent) => void
  readonly createChildContextAfter: (node: Node) => PlaceholderContext
  readonly createChildContextIn: (node: ParentNode) => PlaceholderContext
}

export type PlaceholderContent = ((content: PlaceholderContext) => void) | null

export interface Placeholder extends Lifecycle {
  readonly setContent: (content: PlaceholderContent) => void
}

export interface PlaceholderList extends Lifecycle {
  readonly insert: (index: number, content: PlaceholderContent) => void
  readonly removeAt: (index: number) => void
  readonly moveFromTo: (fromIndex: number, toIndex: number) => void
}

export const createPlaceholderIn = (node: ParentNode): Placeholder => {
  const res = new PlaceholderImpl(new ParentNodePlace(node), null)
  res.mount()
  return res
}

export const createPlaceholderAfter = (node: Node): Placeholder => {
  if (node.parentNode === null) {
    throw new Error("Cannot create placeholder after dangling node without parent")
  }
  const res = new PlaceholderImpl(node, null)
  res.mount()
  return res
}
