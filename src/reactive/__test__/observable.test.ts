import { describe, expect, test } from "@jest/globals"
import { computed, source } from "../observable"

describe("Observable", () => {
  test("Creating source with value should store this value", () => {
    const value = "blabla"
    const s = source(value)

    expect(s.current()).toBe(value)
  })

  test("Changing source value should change stored value", () => {
    const s = source("blabla")

    const value = "blablaChanged"

    s.change(value)

    expect(s.current()).toBe(value)
  })

  test("Creating computed value should not call compute function immediately", () => {
    const computeFunc = jest.fn()
    const c = computed(computeFunc)

    expect(computeFunc).not.toBeCalled()
  })

  test("Creating computed value without dependencies and getting its value should call computed function", () => {
    const computeFunc = jest.fn()
    const c = computed(computeFunc)

    c.current()

    expect(computeFunc).toBeCalledTimes(1)
  })

  test.each([[1], [2], [10]])(
    "Computed function should be called only once if dependencies not changed",
    (callCount) => {
      const computeFunc = jest.fn()
      const c = computed(computeFunc)

      for (let i = 0; i < callCount; ++i) {
        c.current()
      }

      expect(computeFunc).toBeCalledTimes(1)
    },
  )

  describe.each([[42], ["blabla"], [null], [{}], [[]]])("Computing value", (returnedValue) => {
    test("Computed value should return value which computed function returned", () => {
      const c = computed(() => returnedValue)

      const currentValue = c.current()

      expect(currentValue).toBe(returnedValue)
    })

    test.each([[1], [2], [10]])("computed should return the same", (callCount) => {
      const c = computed(() => returnedValue)

      const values: unknown[] = []
      for (let i = 0; i < callCount; ++i) {
        values.push(c.current())
      }

      for (let i = 0; i < callCount; ++i) {
        expect(values[i]).toBe(returnedValue)
      }
    })
  })
})
