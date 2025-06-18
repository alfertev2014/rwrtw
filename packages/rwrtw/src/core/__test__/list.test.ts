import assert from "node:assert"
import test, { describe, beforeEach } from "node:test"

import {
  createRootPlaceholderAt,
  type DOMPlace,
  placeAtBeginningOf,
  type PlaceholderContent,
  type PlaceholderList,
} from "../index.js"

describe("Dynamic list", () => {
  let PARENT_NODE: HTMLElement
  let PARENT_PLACE: DOMPlace

  beforeEach(() => {
    PARENT_NODE = document.createElement("div")
    PARENT_PLACE = placeAtBeginningOf(PARENT_NODE)
  })

  describe("Creating list", () => {
    test("with empty content - should do nothing with DOM", (t) => {
      for (const listContent of [[], [null], [null, null]]) {
        t.test(() => {
          let list: PlaceholderList | undefined
          const placeholder = createRootPlaceholderAt(
            PARENT_PLACE,
            (renderer) => {
              list = renderer.insertList(listContent)
            },
          )

          assert.strictEqual(list?.length, listContent.length)
          assert.strictEqual(list.lastDOMPlace(), PARENT_PLACE)
          assert.strictEqual(placeholder.lastDOMPlace(), PARENT_PLACE)
          assert.strictEqual(PARENT_NODE.childNodes.length, 0)
        })
      }
    })

    test("with one item with one child Node inside - should insert this node at place", () => {
      const innerNode = document.createElement("div")

      let list: PlaceholderList | undefined
      const placeholder = createRootPlaceholderAt(PARENT_PLACE, (renderer) => {
        list = renderer.insertList([
          (renderer) => renderer.insertNode(innerNode),
        ])
      })

      assert.strictEqual(list?.length, 1)
      assert.strictEqual(list.lastDOMPlace(), innerNode)
      assert.strictEqual(placeholder.lastDOMPlace(), innerNode)
      assert.strictEqual(innerNode.parentNode, PARENT_NODE)
      assert.strictEqual(PARENT_NODE.firstChild, innerNode)
    })

    test("with several Nodes in content of one item - should insert nodes in DOM", () => {
      let node: Node = document.createElement("div")
      const firstNode = node

      const NODES_COUNT = 10

      const placeholder = createRootPlaceholderAt(PARENT_PLACE, (renderer) => {
        renderer.insertList([
          (renderer) => {
            renderer.insertNode(node)
            for (let i = 1; i < NODES_COUNT; ++i) {
              node = renderer.insertNode(document.createTextNode("some text"))
            }
          },
        ])
      })

      assert.strictEqual(placeholder.lastDOMPlace(), node)
      assert.strictEqual(firstNode.parentNode, PARENT_NODE)
      assert.strictEqual(node.parentNode, PARENT_NODE)
      assert.strictEqual(PARENT_NODE.firstChild, firstNode)
      assert.strictEqual(PARENT_NODE.childNodes.length, NODES_COUNT)
    })

    test("with several items every with one Node inside - should insert nodes in DOM", () => {
      let node: Node = document.createElement("div")
      const firstNode = node

      const NODES_COUNT = 10

      let list: PlaceholderList | undefined
      const placeholder = createRootPlaceholderAt(PARENT_PLACE, (renderer) => {
        const listContent: PlaceholderContent[] = [
          (renderer) => {
            renderer.insertNode(node)
          },
        ]

        for (let i = 1; i < NODES_COUNT; ++i) {
          listContent.push((renderer) => {
            node = renderer.insertNode(document.createTextNode("some text"))
          })
        }

        renderer.insertList(listContent)
        return list
      })

      assert.strictEqual(placeholder.lastDOMPlace(), node)
      assert.strictEqual(firstNode.parentNode, PARENT_NODE)
      assert.strictEqual(PARENT_NODE.firstChild, firstNode)
      assert.strictEqual(PARENT_NODE.childNodes.length, NODES_COUNT)
    })
  })
})
