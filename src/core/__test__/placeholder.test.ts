import { describe, expect, test } from "@jest/globals"
import { createRootPlaceholderAt, placeAtBeginningOf } from ".."
import { insertNodeAt } from "../impl/place"

describe("Placeholder", () => {
  describe("createRootPlaceholderAt inside regular DOM Node", () => {
    test("with empty content should do nothing with DOM", () => {
      const parent = document.createElement("div")
      const place = placeAtBeginningOf(parent)
      
      const placeholder = createRootPlaceholderAt(place, null)

      expect(placeholder.lastPlaceNode()).toBe(place)
      expect(parent.childNodes.length).toBe(0)
    })

    test("with one child Node should insert this node at place", () => {
      const parent = document.createElement("div")
      const place = placeAtBeginningOf(parent)
      const node = document.createElement("div")
      
      const placeholder = createRootPlaceholderAt(place, (place) => insertNodeAt(place, node))

      expect(placeholder.lastPlaceNode()).toBe(node)
      expect(node.parentNode).toBe(parent)
      expect(parent.firstChild).toBe(node)
    })

    test("with several Nodes in content should insert it in DOM", () => {
      const parent = document.createElement("div")
      const place = placeAtBeginningOf(parent)
      let node: Node = document.createElement("div")
      const firstNode = node

      const NODES_COUNT = 10
      
      const placeholder = createRootPlaceholderAt(place, (place) => {
        insertNodeAt(place, node)
        for (let i = 1; i < NODES_COUNT; ++i) {
          node = insertNodeAt(node, document.createTextNode("some text"))
        }
        return node
      })

      expect(placeholder.lastPlaceNode()).toBe(node)
      expect(firstNode.parentNode).toBe(parent)
      expect(node.parentNode).toBe(parent)
      expect(parent.firstChild).toBe(firstNode)
      expect(parent.childNodes.length).toBe(NODES_COUNT)
    })
  })
})