import { describe, expect, test } from "@jest/globals"
import { dce } from "../helpers"

describe("DOM helpers", () => {
  test("dce shoud create HTMLElement instances", () => {
    const div = dce("div")

    expect(div).toBeInstanceOf(HTMLElement)
    expect(div.tagName).toBe("DIV")
  })
})

