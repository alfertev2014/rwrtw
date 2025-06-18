import assert from "node:assert"
import test, { beforeEach, describe } from "node:test"

import {
  lastDOMPlaceOf,
  placeAtBeginningOf,
  type Place,
  insertNodeAt,
} from "../impl/place.js"
import { createRootPlaceholderAt } from "../impl/placeholder.js"
import { type PlaceholderList, type Placeholder } from "../index.js"

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

    describe("of empty placeholder", () => {
      test("after DOM Node - should return that node", () => {
        const placeholder = createRootPlaceholderAt(CHILD_NODE, null)

        assert.strictEqual(lastDOMPlaceOf(placeholder), CHILD_NODE)
      })

      test("at beginning of DOM Node - should return beginning of that node", () => {
        const beginning = placeAtBeginningOf(PARENT_NODE)
        const placeholder = createRootPlaceholderAt(beginning, null)

        assert.strictEqual(lastDOMPlaceOf(placeholder), beginning)
      })

      test("after DOM Node followed by other empty placeholder - should return that node", () => {
        const beforePlaceholder = createRootPlaceholderAt(CHILD_NODE, null)

        const placeholder = createRootPlaceholderAt(beforePlaceholder, null)

        assert.strictEqual(lastDOMPlaceOf(placeholder), CHILD_NODE)
      })

      test("after DOM Node followed by other not empty placeholder - should return last DOM Node of content of that placeholder", () => {
        const innerNode = document.createElement("div")

        const beforePlaceholder = createRootPlaceholderAt(
          CHILD_NODE,
          (renderer) => {
            renderer.insertNode(innerNode)
          },
        )

        const placeholder = createRootPlaceholderAt(beforePlaceholder, null)

        assert.strictEqual(lastDOMPlaceOf(placeholder), innerNode)
      })

      test("at the beginning of other placeholder which follows a DOM Node - should return that node", () => {
        let placeholder: Placeholder | undefined
        createRootPlaceholderAt(CHILD_NODE, (renderer) => {
          placeholder = renderer.insertPlaceholder(null)
        })

        if (placeholder != null) {
          assert.strictEqual(lastDOMPlaceOf(placeholder), CHILD_NODE)
        } else {
          throw new Error("placeholder is not initialized")
        }
      })

      test("at the beginning of other placeholder which follows a third placeholder - should return last DOM Node of content of that placeholder", () => {
        const innerNode = document.createElement("div")

        const beforePlaceholder = createRootPlaceholderAt(
          CHILD_NODE,
          (renderer) => {
            renderer.insertNode(innerNode)
          },
        )

        let placeholder: Placeholder | undefined
        createRootPlaceholderAt(beforePlaceholder, (renderer) => {
          placeholder = renderer.insertPlaceholder(null)
        })

        if (placeholder != null) {
          assert.strictEqual(lastDOMPlaceOf(placeholder), innerNode)
        } else {
          throw new Error("placeholder is not initialized")
        }
      })
    })

    describe("of not empty placeholder", () => {
      test("when placeholder's content ends with Node - should return this Node", () => {
        const innerNode = document.createElement("div")

        const placeholder = createRootPlaceholderAt(CHILD_NODE, (renderer) => {
          renderer.insertNode(innerNode)
        })

        assert.strictEqual(lastDOMPlaceOf(placeholder), innerNode)
      })

      test("when placeholder contains only empty Placeholder - should return DOM place of itself", () => {
        const placeholder = createRootPlaceholderAt(CHILD_NODE, (renderer) => {
          renderer.insertPlaceholder(null)
        })

        assert.strictEqual(lastDOMPlaceOf(placeholder), CHILD_NODE)
      })

      test("when placeholder's content ends with Node and empty Placeholder - should return that Node", () => {
        const innerNode = document.createElement("div")

        const placeholder = createRootPlaceholderAt(CHILD_NODE, (renderer) => {
          renderer.insertNode(innerNode)
          renderer.insertPlaceholder(null)
        })

        assert.strictEqual(lastDOMPlaceOf(placeholder), innerNode)
      })

      test("when placeholder content ends with Placeholder with Node inside -  should return that Node", () => {
        const innerNode = document.createElement("div")

        const placeholder = createRootPlaceholderAt(CHILD_NODE, (renderer) => {
          renderer.insertPlaceholder((renderer) => {
            renderer.insertNode(innerNode)
          })
        })

        assert.strictEqual(lastDOMPlaceOf(placeholder), innerNode)
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
              let list: PlaceholderList | undefined

              createRootPlaceholderAt(CHILD_NODE, (renderer) => {
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
              let list: PlaceholderList | undefined
              let listPlace: Place | undefined

              createRootPlaceholderAt(CHILD_NODE, (renderer) => {
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

            test("when list after Placeholder with Node inside - should return that Node", () => {
              let list: PlaceholderList | undefined

              createRootPlaceholderAt(CHILD_NODE, (renderer) => {
                renderer.insertPlaceholder((renderer) => {
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

            test("when list at the beginning of Placeholder", () => {
              let list: PlaceholderList | undefined

              createRootPlaceholderAt(CHILD_NODE, (renderer) => {
                renderer.insertPlaceholder((renderer) => {
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

  describe("Inserting nodes after placeholder", () => {
    test("if placeholder is empty it should insert nodes at lastDOMPlace of placeholder", () => {
      const placeholder = createRootPlaceholderAt(CHILD_NODE, null)
      const node = document.createElement("div")

      insertNodeAt(placeholder, node)

      assert.strictEqual(node.previousSibling, CHILD_NODE)
      assert.strictEqual(placeholder.lastDOMPlace(), CHILD_NODE)
    })

    test("if placeholder contains nodes it should insert nodes after content of placeholder", () => {
      const innerNode = document.createElement("div")
      const placeholder = createRootPlaceholderAt(CHILD_NODE, (renderer) => {
        renderer.insertNode(innerNode)
      })
      const node = document.createElement("div")

      insertNodeAt(placeholder, node)

      assert.strictEqual(node.previousSibling, innerNode)
      assert.strictEqual(placeholder.lastDOMPlace(), innerNode)
    })
  })

  describe("Inserting nodes at the beginning of placeholder", () => {
    test("if placeholder is empty it should insert nodes at lastDOMPlace of placeholder", () => {
      const node = document.createElement("div")

      const placeholder = createRootPlaceholderAt(CHILD_NODE, (renderer) => {
        renderer.insertNode(node)
      })

      assert.strictEqual(node.previousSibling, CHILD_NODE)
      assert.strictEqual(placeholder.lastDOMPlace(), node)
    })

    test("if placeholder contains nodes it should insert nodes before content of placeholder", () => {
      const innerNode = document.createElement("div")
      const innerAfterNode = document.createElement("div")
      const placeholder = createRootPlaceholderAt(CHILD_NODE, (renderer) => {
        renderer.insertNode(innerNode)
        renderer.insertNode(innerAfterNode)
      })

      assert.strictEqual(innerNode.previousSibling, CHILD_NODE)
      assert.strictEqual(innerNode.nextSibling, innerAfterNode)
      assert.strictEqual(placeholder.lastDOMPlace(), innerAfterNode)
    })
  })
})
