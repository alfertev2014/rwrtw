import { describe, expect, test } from "@jest/globals"
import { lastDOMPlaceOf, placeAtBeginningOf, type Place, insertNodeAt } from "../impl/place.js"
import { PlaceholderImpl, createChildPlaceholderAt, createRootPlaceholderAt } from "../impl/placeholder.js"
import { type Placeholder } from "../index.js"

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

        expect(domPlace).toBe(node)
      })

      test("of ParentPlaceNode - should return itself", () => {
        const node: Place = placeAtBeginningOf(PARENT_NODE)

        const domPlace = lastDOMPlaceOf(node)

        expect(domPlace).toBe(node)
      })
    })

    describe("of empty placeholder", () => {
      test("after DOM Node - should return that node", () => {
        const placeholder = createRootPlaceholderAt(CHILD_NODE, null)

        expect(lastDOMPlaceOf(placeholder)).toBe(CHILD_NODE)
      })

      test("at beginning of DOM Node - should return beginning of that node", () => {
        const beginning = placeAtBeginningOf(PARENT_NODE)
        const placeholder = createRootPlaceholderAt(beginning, null)

        expect(lastDOMPlaceOf(placeholder)).toBe(beginning)
      })

      test("after DOM Node followed by other empty placeholder - should return that node", () => {
        const beforePlaceholder = createRootPlaceholderAt(CHILD_NODE, null)

        const placeholder = createRootPlaceholderAt(beforePlaceholder, null)

        expect(lastDOMPlaceOf(placeholder)).toBe(CHILD_NODE)
      })

      test("after DOM Node followed by other not empty placeholder - should return last DOM Node of content of that placeholder", () => {
        const innerNode = document.createElement("div")

        const beforePlaceholder = createRootPlaceholderAt(CHILD_NODE, (place) => {
          return insertNodeAt(place, innerNode)
        })

        const placeholder = createRootPlaceholderAt(beforePlaceholder, null)

        expect(lastDOMPlaceOf(placeholder)).toBe(innerNode)
      })

      test("at the beginning of other placeholder which follows a DOM Node - should return that node", () => {
        let placeholder: Placeholder | undefined
        createRootPlaceholderAt(CHILD_NODE, (place, context) => {
          placeholder = createChildPlaceholderAt(place, context, null)
          return placeholder
        })

        if (placeholder != null) {
          expect(lastDOMPlaceOf(placeholder)).toBe(CHILD_NODE)
        } else {
          fail("placeholder is not initialized")
        }
      })

      test("at the beginning of other placeholder which follows a third placeholder - should return last DOM Node of content of that placeholder", () => {
        const innerNode = document.createElement("div")

        const beforePlaceholder = createRootPlaceholderAt(CHILD_NODE, (place) => {
          return insertNodeAt(place, innerNode)
        })

        let placeholder: Placeholder | undefined
        createRootPlaceholderAt(beforePlaceholder, (place, context) => {
          placeholder = createChildPlaceholderAt(place, context, null)
          return placeholder
        })

        if (placeholder != null) {
          expect(lastDOMPlaceOf(placeholder)).toBe(innerNode)
        } else {
          fail("placeholder is not initialized")
        }
      })
    })

    describe("of not empty placeholder", () => {
      test("when placeholder's content ends with Node - should return this Node", () => {
        const innerNode = document.createElement("div")

        const placeholder = createRootPlaceholderAt(CHILD_NODE, (place) => {
          return insertNodeAt(place, innerNode)
        })

        expect(lastDOMPlaceOf(placeholder)).toBe(innerNode)
      })

      test("when placeholder contains only empty Placeholder - should return DOM place of itself", () => {
        const placeholder = createRootPlaceholderAt(CHILD_NODE, (place, context) => {
          return createChildPlaceholderAt(place, context, null)
        })

        expect(lastDOMPlaceOf(placeholder)).toBe(CHILD_NODE)
      })

      test("when placeholder's content ends with Node and empty Placeholder - should return that Node", () => {
        const innerNode = document.createElement("div")

        const placeholder = createRootPlaceholderAt(CHILD_NODE, (place, context) => {
          place = insertNodeAt(place, innerNode)
          return createChildPlaceholderAt(place, context, null);
        })

        expect(lastDOMPlaceOf(placeholder)).toBe(innerNode)
      })

      test("when placeholder content ends with Placeholder with Node inside -  should return that Node", () => {
        const innerNode = document.createElement("div")

        const placeholder = createRootPlaceholderAt(CHILD_NODE, (place, context) => {
          return createChildPlaceholderAt(place, context, (place) => {
            return insertNodeAt(place, innerNode)
          });
        })

        expect(lastDOMPlaceOf(placeholder)).toBe(innerNode)
      })
    })

    describe("of dynamic list", () => {
      describe("when list is empty", () => {
        test("when list after Node", () => {
          fail("TBD")
        })
  
        test("when list at the beginning of Node", () => {
          fail("TBD")
        })
  
        test("when list after Placeholder with Node inside", () => {
          fail("TBD")
        })
  
        test("when list at the beginning of Placeholder", () => {
          fail("TBD")
        })
      })

      describe("when list contains only empty items", () => {

      })
      
      describe("when list contains only empty items", () => {

      })
    })
  })

  describe("Inserting DOM Nodes into place", () => {
    test("should insert DOM Node after Node place", () => {
      const node = document.createElement("div")

      const insertedNode = insertNodeAt(CHILD_NODE, node)

      expect(CHILD_NODE.nextSibling).toBe(node)
      expect(node.previousSibling).toBe(CHILD_NODE)
      expect(node.parentNode).toBe(PARENT_NODE)
      expect(insertedNode).toBe(node)
    })

    test("should throw error when inserting after Node without parent", () => {
      expect(() => {
        const beforeNode = document.createElement("div")
        const node = document.createElement("div")

        insertNodeAt(beforeNode, node)
      }).toThrowError()
    })

    test("should insert DOM Node inside parentNode at beginning", () => {
      const node = document.createElement("div")

      const insertedNode = insertNodeAt(placeAtBeginningOf(PARENT_NODE), node)

      expect(node.previousSibling).toBeNull()
      expect(node.parentNode).toBe(PARENT_NODE)
      expect(insertedNode).toBe(node)
    })

    test("should insert DOM Node inside parentNode at beginning before other child nodes", () => {
      const node = document.createElement("div")

      const insertedNode = insertNodeAt(placeAtBeginningOf(PARENT_NODE), node)

      expect(CHILD_NODE.previousSibling).toBe(node)
      expect(node.previousSibling).toBeNull()
      expect(node.parentNode).toBe(PARENT_NODE)
      expect(insertedNode).toBe(node)
    })
  })

  describe("Inserting nodes after placeholder", () => {
    test("if placeholder is empty it should insert nodes at lastDOMPlace of placeholder", () => {
      const placeholder = createRootPlaceholderAt(CHILD_NODE, null)
      const node = document.createElement("div")

      insertNodeAt(placeholder, node)

      expect(node.previousSibling).toBe(CHILD_NODE)
      expect(placeholder.lastDOMPlace()).toBe(CHILD_NODE)
    })

    test("if placeholder contains nodes it should insert nodes after content of placeholder", () => {
      const innerNode = document.createElement("div")
      const placeholder = createRootPlaceholderAt(CHILD_NODE, (place) => {
        return insertNodeAt(place, innerNode)
      })
      const node = document.createElement("div")

      insertNodeAt(placeholder, node)

      expect(node.previousSibling).toBe(innerNode)
      expect(placeholder.lastDOMPlace()).toBe(innerNode)
    })
  })

  describe("Inserting nodes at the beginning of placeholder", () => {
    test("if placeholder is empty it should insert nodes at lastDOMPlace of placeholder", () => {
      const node = document.createElement("div")
      
      const placeholder = createRootPlaceholderAt(CHILD_NODE, (place, context) => {
        return insertNodeAt(place, node)
      })

      expect(node.previousSibling).toBe(CHILD_NODE)
      expect(placeholder.lastDOMPlace()).toBe(node)
    })

    test("if placeholder contains nodes it should insert nodes before content of placeholder", () => {
      const innerNode = document.createElement("div")
      const innerAfterNode = document.createElement("div")
      const placeholder = createRootPlaceholderAt(CHILD_NODE, (place) => {
        place = insertNodeAt(place, innerNode)
        return insertNodeAt(place, innerAfterNode)
      })

      expect(innerNode.previousSibling).toBe(CHILD_NODE)
      expect(innerNode.nextSibling).toBe(innerAfterNode)
      expect(placeholder.lastDOMPlace()).toBe(innerAfterNode)
    })
  })
})
