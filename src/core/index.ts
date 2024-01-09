import { PlaceholderImpl } from "./impl/placeholder.js"

import { ParentNodePlace, type PlaceholderNode, type Place } from "./impl/place.js"

export { type DOMPlace, ParentNodePlace, type PlaceholderNode, type Place, appendNodeAt } from "./impl/place.js"

export interface Lifecycle {
  readonly mount?: () => void
  readonly unmount?: () => void
  readonly dispose?: () => void
}

export interface PlaceholderContext {
  readonly appendLifecycle: <L extends Lifecycle>(lifecycle: L) => L
  readonly appendNode: <N extends Node>(node: N) => N
  readonly appendPlaceholder: (content: PlaceholderContent) => Placeholder
  readonly appendList: (contents: PlaceholderContent[]) => PlaceholderList
  readonly appendComponent: (content: PlaceholderContent) => void
  readonly createPlaceholderAt: (place: Place, content: PlaceholderContent) => Placeholder
  readonly createListAt: (place: Place, contents: PlaceholderContent[]) => PlaceholderList
  readonly createComponentAt: (place: Place, content: PlaceholderContent) => Place
}

export type PlaceholderContent = ((content: PlaceholderContext) => void) | null

export interface Placeholder extends PlaceholderNode {
  readonly replaceContent: (content: PlaceholderContent) => void
}

export interface PlaceholderList extends PlaceholderNode {
  readonly insert: (index: number, content: PlaceholderContent) => void
  readonly removeAt: (index: number) => void
  readonly moveFromTo: (fromIndex: number, toIndex: number) => void
}

export const createPlaceholderIn = (node: ParentNode, content: PlaceholderContent): Placeholder & Lifecycle => {
  const res = new PlaceholderImpl(new ParentNodePlace(node), content)
  res.mount()
  return res
}

export const createPlaceholderAfter = (node: Node, content: PlaceholderContent): Placeholder & Lifecycle => {
  if (node.parentNode === null) {
    throw new Error("Cannot create placeholder after dangling node without parent")
  }
  const res = new PlaceholderImpl(node, content)
  res.mount()
  return res
}
