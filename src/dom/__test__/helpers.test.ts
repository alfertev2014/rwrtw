import { describe, expect, test } from "@jest/globals"
import { dce, setAttr, txt } from "../helpers"

describe("DOM helpers", () => {
  test("dce shoud create HTMLElement instances", () => {
    const div = dce("div")

    expect(div).toBeInstanceOf(HTMLElement)
    expect(div.tagName).toBe("DIV")
  })

  test("txt shoud create Text instances", () => {
    const text = txt("some text")

    expect(text).toBeInstanceOf(Text)
    expect(text.textContent).toBe("some text")
  })

  describe("setAttr", () => {
    test("should add attribute to element", () => {
      const element = document.createElement("div")

      setAttr(element, "attr", "some value")

      expect(element.getAttribute("attr")).toBe("some value")
    })

    test("should add numeric attribute to element as string", () => {
      const element = document.createElement("div")

      setAttr(element, "attr", 100500)

      expect(element.getAttribute("attr")).toBe("100500")
    })

    test("should add boolean attribute with true value to element as empty string", () => {
      const element = document.createElement("div")

      setAttr(element, "attr", true)

      expect(element.getAttribute("attr")).toBe("")
    })

    test("should remove boolean attribute with false value from element", () => {
      const element = document.createElement("div")
      element.setAttribute("attr", "")

      setAttr(element, "attr", false)

      expect(element.hasAttribute("attr")).toBeFalsy()
    })

    test("should remove attribute with null value from element", () => {
      const element = document.createElement("div")
      element.setAttribute("attr", "")

      setAttr(element, "attr", null)

      expect(element.hasAttribute("attr")).toBeFalsy()
    })

    test("should remove attribute with undefined value from element", () => {
      const element = document.createElement("div")
      element.setAttribute("attr", "")

      setAttr(element, "attr", undefined)

      expect(element.hasAttribute("attr")).toBeFalsy()
    })
  })
})

