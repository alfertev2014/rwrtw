import assert from "node:assert"
import test, { beforeEach, describe } from "node:test"

import {
  lastDOMPlaceOf,
  placeAtBeginningOf,
  type Place,
  insertNodeAt,
} from "../impl/place.js"
import { createRootDynamicNodeAt } from "../impl/dynamicNode.js"
import { type DynamicList, type DynamicNode } from "../index.js"

describe("Place", () => {
  let PARENT_NODE: HTMLElement
  let CHILD_NODE: HTMLElement

  beforeEach(() => {
    PARENT_NODE = document.createElement("div")
    CHILD_NODE = document.createElement("div")
    PARENT_NODE.appendChild(CHILD_NODE)
  })

  describe("lastDOMPlace", () => {
    describe("of DOMPlace itself", () => {
      test("of DOM Node - should return itself", () => {
        const node: Place = PARENT_NODE

        const domPlace = lastDOMPlaceOf(node)

        assert.strictEqual(domPlace, node)
      })

      test("of ParentPlaceNode - should return itself", () => {
        const node: Place = placeAtBeginningOf(PARENT_NODE)

        const domPlace = lastDOMPlaceOf(node)

        assert.strictEqual(domPlace, node)
      })
    })

    describe("of empty dynamic node", () => {
      test("after DOM Node - should return that node", () => {
        const dynamicNode = createRootDynamicNodeAt(CHILD_NODE, null)

        assert.strictEqual(lastDOMPlaceOf(dynamicNode), CHILD_NODE)
      })

      test("at beginning of DOM Node - should return beginning of that node", () => {
        const beginning = placeAtBeginningOf(PARENT_NODE)
        const dynamicNode = createRootDynamicNodeAt(beginning, null)

        assert.strictEqual(lastDOMPlaceOf(dynamicNode), beginning)
      })

      test("after DOM Node followed by other empty dynamicNode - should return that node", () => {
        const beforeDynamicNode = createRootDynamicNodeAt(CHILD_NODE, null)

        const dynamicNode = createRootDynamicNodeAt(beforeDynamicNode, null)

        assert.strictEqual(lastDOMPlaceOf(dynamicNode), CHILD_NODE)
      })

      test("after DOM Node followed by other not empty dynamicNode - should return last DOM Node of content of that dynamicNode", () => {
        const innerNode = document.createElement("div")

        const beforeDynamicNode = createRootDynamicNodeAt(
          CHILD_NODE,
          (renderer) => {
            renderer.insertNode(innerNode)
          },
        )

        const dynamicNode = createRootDynamicNodeAt(beforeDynamicNode, null)

        assert.strictEqual(lastDOMPlaceOf(dynamicNode), innerNode)
      })

      test("at the beginning of other dynamicNode which follows a DOM Node - should return that node", () => {
        let dynamicNode: DynamicNode | undefined
        createRootDynamicNodeAt(CHILD_NODE, (renderer) => {
          dynamicNode = renderer.insertDynamicNode(null)
        })

        if (dynamicNode != null) {
          assert.strictEqual(lastDOMPlaceOf(dynamicNode), CHILD_NODE)
        } else {
          throw new Error("dynamicNode is not initialized")
        }
      })

      test("at the beginning of other dynamicNode which follows a third dynamicNode - should return last DOM Node of content of that dynamicNode", () => {
        const innerNode = document.createElement("div")

        const beforeDynamicNode = createRootDynamicNodeAt(
          CHILD_NODE,
          (renderer) => {
            renderer.insertNode(innerNode)
          },
        )

        let dynamicNode: DynamicNode | undefined
        createRootDynamicNodeAt(beforeDynamicNode, (renderer) => {
          dynamicNode = renderer.insertDynamicNode(null)
        })

        if (dynamicNode != null) {
          assert.strictEqual(lastDOMPlaceOf(dynamicNode), innerNode)
        } else {
          throw new Error("dynamicNode is not initialized")
        }
      })
    })

    describe("of not empty dynamicNode", () => {
      test("when dynamicNode's content ends with Node - should return this Node", () => {
        const innerNode = document.createElement("div")

        const dynamicNode = createRootDynamicNodeAt(CHILD_NODE, (renderer) => {
          renderer.insertNode(innerNode)
        })

        assert.strictEqual(lastDOMPlaceOf(dynamicNode), innerNode)
      })

      test("when dynamicNode contains only empty DynamicNode - should return DOM place of itself", () => {
        const dynamicNode = createRootDynamicNodeAt(CHILD_NODE, (renderer) => {
          renderer.insertDynamicNode(null)
        })

        assert.strictEqual(lastDOMPlaceOf(dynamicNode), CHILD_NODE)
      })

      test("when dynamicNode's content ends with Node and empty DynamicNode - should return that Node", () => {
        const innerNode = document.createElement("div")

        const dynamicNode = createRootDynamicNodeAt(CHILD_NODE, (renderer) => {
          renderer.insertNode(innerNode)
          renderer.insertDynamicNode(null)
        })

        assert.strictEqual(lastDOMPlaceOf(dynamicNode), innerNode)
      })

      test("when dynamicNode content ends with DynamicNode with Node inside -  should return that Node", () => {
        const innerNode = document.createElement("div")

        const dynamicNode = createRootDynamicNodeAt(CHILD_NODE, (renderer) => {
          renderer.insertDynamicNode((renderer) => {
            renderer.insertNode(innerNode)
          })
        })

        assert.strictEqual(lastDOMPlaceOf(dynamicNode), innerNode)
      })
    })

    describe("of dynamic list", () => {
      let INNER_CHILD_NODE: HTMLElement

      beforeEach(() => {
        INNER_CHILD_NODE = document.createElement("div")
      })

      describe("when list is empty", () => {
        test((t) => {
          for (const LIST_ITEMS of [[], [null], [null, null]]) {
            t.test("when list after Node - should return that Node", () => {
              let list: DynamicList | undefined

              createRootDynamicNodeAt(CHILD_NODE, (renderer) => {
                renderer.insertNode(INNER_CHILD_NODE)
                list = renderer.insertList(LIST_ITEMS)
              })

              if (list != null) {
                assert.strictEqual(lastDOMPlaceOf(list), INNER_CHILD_NODE)
              } else {
                throw new Error("list is not initialized")
              }
            })

            test("when list at the beginning of Node - should return the beginning of than Node", () => {
              let list: DynamicList | undefined
              let listPlace: Place | undefined

              createRootDynamicNodeAt(CHILD_NODE, (renderer) => {
                renderer.insertNode(INNER_CHILD_NODE)

                listPlace = placeAtBeginningOf(INNER_CHILD_NODE)
                const subrenderer = renderer.createRendererAt(listPlace)
                list = subrenderer.insertList(LIST_ITEMS)
              })

              if (list != null && listPlace != null) {
                assert.strictEqual(lastDOMPlaceOf(list), listPlace)
              } else {
                throw new Error("list or listPlace are not initialized")
              }
            })

            test("when list after DynamicNode with Node inside - should return that Node", () => {
              let list: DynamicList | undefined

              createRootDynamicNodeAt(CHILD_NODE, (renderer) => {
                renderer.insertDynamicNode((renderer) => {
                  renderer.insertNode(INNER_CHILD_NODE)
                })
                list = renderer.insertList(LIST_ITEMS)
              })

              if (list != null) {
                assert.strictEqual(lastDOMPlaceOf(list), INNER_CHILD_NODE)
              } else {
                throw new Error("list is not initialized")
              }
            })

            test("when list at the beginning of DynamicNode", () => {
              let list: DynamicList | undefined

              createRootDynamicNodeAt(CHILD_NODE, (renderer) => {
                renderer.insertDynamicNode((renderer) => {
                  renderer.insertNode(INNER_CHILD_NODE)
                })
                list = renderer.insertList(LIST_ITEMS)
              })

              if (list != null) {
                assert.strictEqual(lastDOMPlaceOf(list), INNER_CHILD_NODE)
              } else {
                throw new Error("list is not initialized")
              }
            })
          }
        })
      })
    })
  })

  describe("Inserting DOM Nodes into place", () => {
    test("should insert DOM Node after Node place", () => {
      const node = document.createElement("div")

      const insertedNode = insertNodeAt(CHILD_NODE, node)

      assert.strictEqual(CHILD_NODE.nextSibling, node)
      assert.strictEqual(node.previousSibling, CHILD_NODE)
      assert.strictEqual(node.parentNode, PARENT_NODE)
      assert.strictEqual(insertedNode, node)
    })

    test("should throw error when inserting after Node without parent", () => {
      assert.throws(() => {
        const beforeNode = document.createElement("div")
        const node = document.createElement("div")

        insertNodeAt(beforeNode, node)
      })
    })

    test("should insert DOM Node inside parentNode at beginning", () => {
      const node = document.createElement("div")

      const insertedNode = insertNodeAt(placeAtBeginningOf(PARENT_NODE), node)

      assert.strictEqual(node.previousSibling, null)
      assert.strictEqual(node.parentNode, PARENT_NODE)
      assert.strictEqual(insertedNode, node)
    })

    test("should insert DOM Node inside parentNode at beginning before other child nodes", () => {
      const node = document.createElement("div")

      const insertedNode = insertNodeAt(placeAtBeginningOf(PARENT_NODE), node)

      assert.strictEqual(CHILD_NODE.previousSibling, node)
      assert.strictEqual(node.previousSibling, null)
      assert.strictEqual(node.parentNode, PARENT_NODE)
      assert.strictEqual(insertedNode, node)
    })
  })

  describe("Inserting nodes after dynamicNode", () => {
    test("if dynamicNode is empty it should insert nodes at lastDOMPlace of dynamicNode", () => {
      const dynamicNode = createRootDynamicNodeAt(CHILD_NODE, null)
      const node = document.createElement("div")

      insertNodeAt(dynamicNode, node)

      assert.strictEqual(node.previousSibling, CHILD_NODE)
      assert.strictEqual(dynamicNode.lastDOMPlace(), CHILD_NODE)
    })

    test("if dynamicNode contains nodes it should insert nodes after content of dynamicNode", () => {
      const innerNode = document.createElement("div")
      const dynamicNode = createRootDynamicNodeAt(CHILD_NODE, (renderer) => {
        renderer.insertNode(innerNode)
      })
      const node = document.createElement("div")

      insertNodeAt(dynamicNode, node)

      assert.strictEqual(node.previousSibling, innerNode)
      assert.strictEqual(dynamicNode.lastDOMPlace(), innerNode)
    })
  })

  describe("Inserting nodes at the beginning of dynamicNode", () => {
    test("if dynamicNode is empty it should insert nodes at lastDOMPlace of dynamicNode", () => {
      const node = document.createElement("div")

      const dynamicNode = createRootDynamicNodeAt(CHILD_NODE, (renderer) => {
        renderer.insertNode(node)
      })

      assert.strictEqual(node.previousSibling, CHILD_NODE)
      assert.strictEqual(dynamicNode.lastDOMPlace(), node)
    })

    test("if dynamicNode contains nodes it should insert nodes before content of dynamicNode", () => {
      const innerNode = document.createElement("div")
      const innerAfterNode = document.createElement("div")
      const dynamicNode = createRootDynamicNodeAt(CHILD_NODE, (renderer) => {
        renderer.insertNode(innerNode)
        renderer.insertNode(innerAfterNode)
      })

      assert.strictEqual(innerNode.previousSibling, CHILD_NODE)
      assert.strictEqual(innerNode.nextSibling, innerAfterNode)
      assert.strictEqual(dynamicNode.lastDOMPlace(), innerAfterNode)
    })
  })
})
