import assert from "node:assert"
import test, { describe } from "node:test"
import { dce, setAttr, txt } from "../helpers.js"

describe("DOM helpers", () => {
  test("dce should create HTMLElement instances", () => {
    const div = dce("div")

    assert(div instanceof HTMLElement)
    assert.strictEqual(div, "DIV")
  })

  test("txt should create Text instances", () => {
    const text = txt("some text")

    assert(text instanceof Text)
    assert.strictEqual(text.textContent, "some text")
  })

  describe("setAttr", () => {
    test("should add attribute to element", () => {
      const element = document.createElement("div")

      setAttr(element, "attr", "some value")

      assert.strictEqual(element.getAttribute("attr"), "some value")
    })

    test("should add numeric attribute to element as string", () => {
      const element = document.createElement("div")

      setAttr(element, "attr", 100500)

      assert.strictEqual(element.getAttribute("attr"), "100500")
    })

    test("should add boolean attribute with true value to element as empty string", () => {
      const element = document.createElement("div")

      setAttr(element, "attr", true)

      assert.strictEqual(element.getAttribute("attr"), "")
    })

    test("should remove boolean attribute with false value from element", () => {
      const element = document.createElement("div")
      element.setAttribute("attr", "")

      setAttr(element, "attr", false)

      assert(!element.hasAttribute("attr"))
    })

    test("should remove attribute with null value from element", () => {
      const element = document.createElement("div")
      element.setAttribute("attr", "")

      setAttr(element, "attr", null)

      assert(!element.hasAttribute("attr"))
    })

    test("should remove attribute with undefined value from element", () => {
      const element = document.createElement("div")
      element.setAttribute("attr", "")

      setAttr(element, "attr", undefined)

      assert(!element.hasAttribute("attr"))
    })
  })
})
