import { describe, expect, test } from "@jest/globals"
import { lastPlaceNode, placeAtBeginingOf, type Place } from "../impl/place.js"
import { PlaceholderImpl } from "../impl/placeholder.js"

describe("Place", () => {
  describe("lastPlaceNode", () => {
    test("of DOM Node should be itself", () => {
      const node: Place = document.createElement('div')

      const domPlace = lastPlaceNode(node)

      expect(domPlace).toBe(node)
    })

    test("of ParentPlaceNode should be itself", () => {
      const node: Place = placeAtBeginingOf(document.createElement('div'))

      const domPlace = lastPlaceNode(node)

      expect(domPlace).toBe(node)
    })

    test("of empty placeholder after DOM Node should be that node", () => {
      const parent = document.createElement('div')
      const node = parent.appendChild(document.createElement('a'))

      const placeholder = new PlaceholderImpl(node, null)

      expect(placeholder.lastPlaceNode()).toBe(node)
    })

    test("of empty placeholder at beginning of DOM Node should be ParentNodePlace of that node", () => {
      const parent = document.createElement('div')
      parent.appendChild(document.createElement('a'))
      
      const beginning = placeAtBeginingOf(parent)
      const placeholder = new PlaceholderImpl(beginning, null)

      expect(placeholder.lastPlaceNode()).toBe(beginning)
    })
  })
})