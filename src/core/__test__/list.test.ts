import { describe, expect, test } from "@jest/globals"
import { type DOMPlace, placeAtBeginningOf, insertNodeAt } from "../impl/place"
import { createListAt, createRootPlaceholderAt, type PlaceholderList } from ".."

describe("Dynamic list", () => {
  let PARENT_NODE: HTMLElement
  let PARENT_PLACE: DOMPlace

  beforeEach(() => {
    PARENT_NODE = document.createElement("div")
    PARENT_PLACE = placeAtBeginningOf(PARENT_NODE)
  })

  describe("Creating list", () => {
    test.each([[[]], [[null]], [[null, null]]])("with empty content - should do nothing with DOM", (listContent) => {
      let list: PlaceholderList | undefined
      const placeholder = createRootPlaceholderAt(PARENT_PLACE, (place, context) => {
        list = createListAt(place, context, listContent)
        return list
      })

      expect(list?.length).toBe(listContent.length)
      expect(list?.lastDOMPlace()).toBe(PARENT_PLACE)
      expect(placeholder.lastDOMPlace()).toBe(PARENT_PLACE)
      expect(PARENT_NODE.childNodes.length).toBe(0)
    })

    test("with one item with one child Node inside - should insert this node at place", () => {
      const innerNode = document.createElement("div")

      let list: PlaceholderList | undefined
      const placeholder = createRootPlaceholderAt(PARENT_PLACE, (place, context) => {
        list = createListAt(place, context, [(place) => insertNodeAt(place, innerNode)])
        return list
      })

      expect(list?.length).toBe(1)
      expect(list?.lastDOMPlace()).toBe(innerNode)
      expect(placeholder.lastDOMPlace()).toBe(innerNode)
      expect(innerNode.parentNode).toBe(PARENT_NODE)
      expect(PARENT_NODE.firstChild).toBe(innerNode)
    })

    test("with several Nodes in content of one item - should insert nodes in DOM", () => {
      let node: Node = document.createElement("div")
      const firstNode = node

      const NODES_COUNT = 10

      let list: PlaceholderList | undefined
      const placeholder = createRootPlaceholderAt(PARENT_PLACE, (place, context) => {
        list = createListAt(place, context, [
          (place) => {
            insertNodeAt(place, node)
            for (let i = 1; i < NODES_COUNT; ++i) {
              node = insertNodeAt(node, document.createTextNode("some text"))
            }
            return node
          },
        ])
        return list
      })

      expect(placeholder.lastDOMPlace()).toBe(node)
      expect(firstNode.parentNode).toBe(PARENT_NODE)
      expect(node.parentNode).toBe(PARENT_NODE)
      expect(PARENT_NODE.firstChild).toBe(firstNode)
      expect(PARENT_NODE.childNodes.length).toBe(NODES_COUNT)
    })

    test("with several items every with one Node inside - should insert nodes in DOM", () => {
      let node: Node = document.createElement("div")
      const firstNode = node

      const NODES_COUNT = 10

      let list: PlaceholderList | undefined
      const placeholder = createRootPlaceholderAt(PARENT_PLACE, (place, context) => {
        const listContent = [
          (place) => {
            return insertNodeAt(place, node)
          },
        ]

        for (let i = 1; i < NODES_COUNT; ++i) {
          listContent.push((place) => {
            node = insertNodeAt(place, document.createTextNode("some text"))
            return node
          })
        }

        list = createListAt(place, context, listContent)
        return list
      })

      expect(placeholder.lastDOMPlace()).toBe(node)
      expect(firstNode.parentNode).toBe(PARENT_NODE)
      expect(node.parentNode).toBe(PARENT_NODE)
      expect(PARENT_NODE.firstChild).toBe(firstNode)
      expect(PARENT_NODE.childNodes.length).toBe(NODES_COUNT)
    })
  })
})
