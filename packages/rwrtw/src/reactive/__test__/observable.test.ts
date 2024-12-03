import { jest, describe, expect, test } from "@jest/globals"
import { computed, effect, source, batch } from "../observable"
import { PlainData } from "../types"

describe("Observable", () => {
  describe("Source", () => {
    test("Creating source with value should store this value", () => {
      const value = "s"
      const s = source<string>(value)

      expect(s.current()).toBe(value)
    })

    test("Changing source value should change stored value", () => {
      const s = source<string>("s")

      const value = "sChanged"

      s.change(value)

      expect(s.current()).toBe(value)
    })
  })

  describe("Computed", () => {
    test("Creating computed value should not call compute function immediately", () => {
      const computeFunc = jest.fn<()=>PlainData>()
      const c = computed(computeFunc)

      expect(computeFunc).toBeCalledTimes(0)
    })

    test("Creating computed value without dependencies and getting its value should call computed function", () => {
      const computeFunc = jest.fn(() => 42)
      const c = computed(computeFunc)

      c.current()

      expect(computeFunc).toBeCalledTimes(1)
    })

    test.each([[1], [2], [10]])(
      "Computed function should be called only once if dependencies not changed",
      (callCount) => {
        const computeFunc = jest.fn(() => 42)
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

        expect(c.current()).toBe(returnedValue)
      })

      test.each([[1], [2], [10]])(
        "computed should return the cached value after first computing",
        (callCount) => {
          const c = computed(() => returnedValue)

          const values: unknown[] = []
          for (let i = 0; i < callCount; ++i) {
            values.push(c.current())
          }

          for (let i = 0; i < callCount; ++i) {
            expect(values[i]).toBe(returnedValue)
          }
        },
      )
    })
  })

  describe("Dependencies", () => {
    describe("One computed depends on one source", () => {
      // s <-- c

      test("should return computed value", () => {
        const s = source<string>("s")
        const c = computed(() => "c-" + s.current())

        expect(c.current()).toBe("c-s")
      })

      test("should recalculate value if source changed", () => {
        const s = source<string>("s")
        const c = computed(() => "c-" + s.current())

        c.current()
        s.change("sChanged")

        expect(c.current()).toBe("c-sChanged")
      })

      test("Computed function should not be called after source changed", () => {
        const s = source<string>("s")
        const computedFunc = jest.fn(() => "c-" + s.current())
        const c = computed(computedFunc)

        s.change("sChanged")

        expect(computedFunc).not.toBeCalled()
      })

      test("Computed function should be called when requesting current value", () => {
        const s = source<string>("s")
        const computedFunc = jest.fn(() => "c-" + s.current())
        const c = computed(computedFunc)

        s.change("sChanged")

        c.current()

        expect(computedFunc).toBeCalledTimes(1)
      })

      test.each([[1], [2], [10]])(
        "Computed function should be called only once if source value changed to the same value",
        (callCount) => {
          const s = source<string>("s")
          const computedFunc = jest.fn(() => "c-" + s.current())
          const c = computed(computedFunc)
          c.current()

          for (let i = 0; i < callCount; ++i) {
            s.change("sChanged")
            c.current()
          }

          expect(computedFunc).toBeCalledTimes(2)
        },
      )

      test.each([[1], [2], [10]])(
        "Computed function should be called every time when source value changed to a different value",
        (callCount) => {
          const s = source<string>("s")
          const computedFunc = jest.fn(() => "c-" + s.current())
          const c = computed(computedFunc)
          c.current()

          for (let i = 0; i < callCount; ++i) {
            s.change("sChanged" + i)
            c.current()
          }

          expect(computedFunc).toBeCalledTimes(callCount + 1)
        },
      )

      test("Computed function should be called when requesting current value even if source is used multiple times", () => {
        const s = source<string>("s")
        const computedFunc = jest.fn(() => "c-" + s.current() + s.current())
        const c = computed(computedFunc)

        s.change("sChanged")

        c.current()

        expect(computedFunc).toBeCalledTimes(1)
      })
    })

    describe("Two computed depends on one source", () => {
      //  s <-- c1
      //   \-- c2

      test("should recalculate if source changed", () => {
        const s = source<string>("s")
        const c1 = computed(() => "c1-" + s.current())
        const c2 = computed(() => "c2-" + s.current())

        c1.current()
        c2.current()
        s.change("sChanged")

        expect(c1.current()).toBe("c1-sChanged")
        expect(c2.current()).toBe("c2-sChanged")
      })

      test("Computed function should be called only if computed value called", () => {
        const s = source<string>("s")
        const computedFunc1 = jest.fn(() => "c1-" + s.current())
        const c1 = computed(computedFunc1)
        const computedFunc2 = jest.fn(() => "c2-" + s.current())
        const c2 = computed(computedFunc2)

        s.change("sChanged")
        c2.current()

        expect(computedFunc1).toBeCalledTimes(0)
        expect(computedFunc2).toBeCalledTimes(1)
      })
    })

    describe("Transitive dependency with one source and two computed", () => {
      // s <-- c1 <-- c2

      test("computed should return values returned by its computed functions", () => {
        const s = source<string>("s")
        const c1 = computed(() => "c1-" + s.current())
        const c2 = computed(() => "c2-" + c1.current())

        expect(c1.current()).toBe("c1-s")
        expect(c2.current()).toBe("c2-c1-s")
      })

      test("should recalculate transient dependency if source changed", () => {
        const s = source<string>("s")
        const c1 = computed(() => "c1-" + s.current())
        const c2 = computed(() => "c2-" + c1.current())

        c1.current()
        s.change("sChanged")

        expect(c1.current()).toBe("c1-sChanged")
        expect(c2.current()).toBe("c2-c1-sChanged")
      })

      test("should recalculate final computed if source changed", () => {
        const s = source<string>("s")
        const c1 = computed(() => "c1-" + s.current())
        const c2 = computed(() => "c2-" + c1.current())

        c1.current()
        c2.current()
        s.change("sChanged")

        expect(c1.current()).toBe("c1-sChanged")
        expect(c2.current()).toBe("c2-c1-sChanged")
      })

      test("Computed function should be called only if computed value called", () => {
        const s = source<string>("s")
        const computedFunc1 = jest.fn(() => "c1-" + s.current())
        const c1 = computed(computedFunc1)
        const computedFunc2 = jest.fn(() => "c2-" + c1.current())
        const c2 = computed(computedFunc2)

        s.change("sChanged")
        c1.current()

        expect(computedFunc1).toBeCalledTimes(1)
        expect(computedFunc2).not.toBeCalled()

        c2.current()

        expect(computedFunc1).toBeCalledTimes(1)
        expect(computedFunc2).toBeCalledTimes(1)
      })

      test.each([[1], [2], [10]])(
        "Computed function should be called only once after source change",
        (callCount) => {
          const s = source<string>("s")
          const computedFunc1 = jest.fn(() => "c1-" + s.current())
          const c1 = computed(computedFunc1)
          const computedFunc2 = jest.fn(() => "c2-" + c1.current())
          const c2 = computed(computedFunc2)

          s.change("sChanged")

          for (let i = 0; i < callCount; ++i) {
            c2.current()
          }

          expect(computedFunc1).toBeCalledTimes(1)
          expect(computedFunc2).toBeCalledTimes(1)
        },
      )
    })

    describe("One source, two transient computed and one dependent computed", () => {
      // s <-- c1 <-- c3
      //  \-- c2 <---/

      test("computed should return values returned by its computed functions", () => {
        const s = source<string>("s")
        const c1 = computed(() => "c1-" + s.current())
        const c2 = computed(() => "c2-" + s.current())
        const c3 = computed(() => `c3 ${c1.current()} ${c2.current()}`)

        expect(c1.current()).toBe("c1-s")
        expect(c2.current()).toBe("c2-s")
        expect(c3.current()).toBe("c3 c1-s c2-s")
      })

      test("should recalculate if source changed", () => {
        const s = source<string>("s")
        const c1 = computed(() => "c1-" + s.current())
        const c2 = computed(() => "c2-" + s.current())
        const c3 = computed(() => `c3 ${c1.current()} ${c2.current()}`)

        c3.current()
        s.change("sChanged")

        expect(c1.current()).toBe("c1-sChanged")
        expect(c2.current()).toBe("c2-sChanged")
        expect(c3.current()).toBe("c3 c1-sChanged c2-sChanged")
      })

      test("Computed function should be called only if computed value called", () => {
        const s = source<string>("s")
        const computedFunc1 = jest.fn(() => "c1-" + s.current())
        const c1 = computed(computedFunc1)
        const computedFunc2 = jest.fn(() => "c2-" + s.current())
        const c2 = computed(computedFunc2)
        const computedFunc3 = jest.fn(() => `c3 ${c1.current()} ${c2.current()}`)
        const c3 = computed(computedFunc3)

        s.change("sChanged")
        c1.current()

        expect(computedFunc1).toBeCalledTimes(1)
        expect(computedFunc2).not.toBeCalled()
        expect(computedFunc3).not.toBeCalled()

        c3.current()

        expect(computedFunc1).toBeCalledTimes(1)
        expect(computedFunc2).toBeCalledTimes(1)
        expect(computedFunc3).toBeCalledTimes(1)
      })

      test.each([[1], [2], [10]])(
        "Computed function should be called only once after source change",
        (callCount) => {
          const s = source<string>("s")
          const computedFunc1 = jest.fn(() => "c1-" + s.current())
          const c1 = computed(computedFunc1)
          const computedFunc2 = jest.fn(() => "c2-" + s.current())
          const c2 = computed(computedFunc2)
          const computedFunc3 = jest.fn(() => `c3 ${c1.current()} ${c2.current()}`)
          const c3 = computed(computedFunc3)

          s.change("sChanged")

          for (let i = 0; i < callCount; ++i) {
            c3.current()
          }

          expect(computedFunc1).toBeCalledTimes(1)
          expect(computedFunc2).toBeCalledTimes(1)
          expect(computedFunc3).toBeCalledTimes(1)
        },
      )
    })

    describe("One source, two dependent computed and third computed conditionally depends on second computed if first computed is falsy", () => {
      // s <-- c1 <---------- c3
      //  \-- c2 (if c1) <---/

      test("in true case computed should return values returned by its computed functions", () => {
        const s = source<string>("s")
        const c1 = computed(() => "c1-" + s.current())
        const c2 = computed(() => (s.current() !== "" ? "c2-" + s.current() : ""))
        const c3 = computed(() => `c3 ${c1.current() !== "" ? c2.current() : "false"}`)

        expect(c1.current()).toBe("c1-s")
        expect(c2.current()).toBe("c2-s")
        expect(c3.current()).toBe("c3 c2-s")
      })

      test("in false case computed should return values returned by its computed functions", () => {
        const s = source("")
        const c1 = computed(() => (s.current() !== "" ? "c1-" + s.current() : ""))
        const c2 = computed(() => "c2-" + s.current())
        const c3 = computed(() => `c3 ${c1.current() !== "" ? c2.current() : "false"}`)

        expect(c1.current()).toBe("")
        expect(c2.current()).toBe("c2-")
        expect(c3.current()).toBe("c3 false")
      })

      test("should recalculate if source changed", () => {
        const s = source<string>("s")
        const c1 = computed(() => (s.current() !== "" ? "c1-" + s.current() : ""))
        const c2 = computed(() => "c2-" + s.current())
        const c3 = computed(() => `c3 ${c1.current() !== "" ? c2.current() : "false"}`)

        c3.current()
        s.change("")

        expect(c1.current()).toBe("")
        expect(c2.current()).toBe("c2-")
        expect(c3.current()).toBe("c3 false")
      })

      test("in true case computed function should be called only if computed value called", () => {
        const s = source<string>("s")
        const computedFunc1 = jest.fn(() => (s.current() !== "" ? "c1-" + s.current() : ""))
        const c1 = computed(computedFunc1)
        const computedFunc2 = jest.fn(() => "c2" + s.current())
        const c2 = computed(computedFunc2)
        const computedFunc3 = jest.fn(() => `c3 ${c1.current() !== "" ? c2.current() : "false"}`)
        const c3 = computed(computedFunc3)

        s.change("sChanged")
        c1.current()

        expect(computedFunc1).toBeCalledTimes(1)
        expect(computedFunc2).not.toBeCalled()
        expect(computedFunc3).not.toBeCalled()

        c3.current()

        expect(computedFunc1).toBeCalledTimes(1)
        expect(computedFunc2).toBeCalledTimes(1)
        expect(computedFunc3).toBeCalledTimes(1)
      })

      test("in false case computed function should be called only if computed value called", () => {
        const s = source<string>("s")
        const computedFunc1 = jest.fn(() => (s.current() !== "" ? "c1-" + s.current() : ""))
        const c1 = computed(computedFunc1)
        const computedFunc2 = jest.fn(() => "c2" + s.current())
        const c2 = computed(computedFunc2)
        const computedFunc3 = jest.fn(() => `c3 ${c1.current() !== "" ? c2.current() : "false"}`)
        const c3 = computed(computedFunc3)

        s.change("")
        c1.current()

        expect(computedFunc1).toBeCalledTimes(1)
        expect(computedFunc2).not.toBeCalled()
        expect(computedFunc3).not.toBeCalled()

        c3.current()

        expect(computedFunc1).toBeCalledTimes(1)
        expect(computedFunc2).toBeCalledTimes(0)
        expect(computedFunc3).toBeCalledTimes(1)
      })

      test.each([[1], [2], [10]])(
        "in false case after true case computed should unsubscribe from non needed dependency and and its compute function should not be called any more",
        (callCount) => {
          const s = source<string>("s")
          const computedFunc1 = jest.fn(() => (s.current() !== "" ? "c1-" + s.current() : ""))
          const c1 = computed(computedFunc1)
          const computedFunc2 = jest.fn(() => "c2" + s.current())
          const c2 = computed(computedFunc2)
          const computedFunc3 = jest.fn(() => `c3 ${c1.current() !== "" ? c2.current() : "false"}`)
          const c3 = computed(computedFunc3)

          c3.current()

          expect(computedFunc1).toBeCalledTimes(1)
          expect(computedFunc2).toBeCalledTimes(1)
          expect(computedFunc3).toBeCalledTimes(1)

          s.change("")

          for (let i = 0; i < callCount; ++i) {
            c3.current()
          }

          expect(computedFunc1).toBeCalledTimes(2)
          expect(computedFunc2).toBeCalledTimes(1)
          expect(computedFunc3).toBeCalledTimes(2)
        },
      )
    })
  })

  describe("Effects", () => {
    describe("One effect depends on one source", () => {
      // s <-- e

      test("Effect function should not be called after creation", () => {
        const s = source<string>("s")
        const effectFunc = jest.fn()
        const e = effect(s, effectFunc)

        expect(effectFunc).toBeCalledTimes(0)
      })

      test("Effect function should not be called after batch end", () => {
        const effectFunc = jest.fn()
        batch(() => {
          const s = source<string>("s")
          const e = effect(s, effectFunc)

          expect(effectFunc).toBeCalledTimes(0)
        })
        expect(effectFunc).toBeCalledTimes(0)
      })

      test("Effect function should not be called for unsubscribed effect after batch end", () => {
        const effectFunc = jest.fn()
        batch(() => {
          const s = source<string>("s")
          const e = effect(s, effectFunc)

          expect(effectFunc).toBeCalledTimes(0)

          e.unsubscribe()
        })
        expect(effectFunc).toBeCalledTimes(0)
      })

      test.each([[1], [2], [10]])(
        "Effect function should be called after every source change",
        (callCount) => {
          const s = source<string>("s")
          const effectFunc = jest.fn()
          const e = effect(s, effectFunc)

          for (let i = 0; i < callCount; ++i) {
            s.change("sChanged" + i)
          }

          expect(effectFunc).toBeCalledTimes(callCount)
        },
      )

      test.each([[1], [2], [10]])(
        "Effect function should not be called after batch end with source changes",
        (callCount) => {
          const s = source<string>("s")
          const effectFunc = jest.fn()

          batch(() => {
            const e = effect(s, effectFunc)
            for (let i = 0; i < callCount; ++i) {
              s.change("sChanged" + i)
            }
          })

          expect(effectFunc).toBeCalledTimes(0)
        },
      )

      test.each([[1], [2], [10]])(
        "Effect function should not be called after unsubscribe",
        (callCount) => {
          const s = source<string>("s")
          const effectFunc = jest.fn()
          const e = effect(s, effectFunc)
          e.unsubscribe()

          for (let i = 0; i < callCount; ++i) {
            s.change("sChanged" + i)
          }

          expect(effectFunc).toBeCalledTimes(0)
        },
      )
    })

    describe("One effect depends transitively on one source", () => {
      // s <-- c <-- e

      test.each([[1], [2], [10]])(
        "Effect function should be called after every source change",
        (callCount) => {
          const s = source<string>("s")
          const c = computed(() => s.current())
          const effectFunc = jest.fn()
          const e = effect(c, effectFunc)

          for (let i = 0; i < callCount; ++i) {
            s.change("sChanged" + i)
          }

          expect(effectFunc).toBeCalledTimes(callCount)
        },
      )

      test.each([[1], [2], [10]])(
        "Effect function should not be called after batch end with source changes",
        (callCount) => {
          const s = source<string>("s")
          const c = computed(() => s.current())
          const effectFunc = jest.fn()

          batch(() => {
            const e = effect(c, effectFunc)
            for (let i = 0; i < callCount; ++i) {
              s.change("sChanged" + i)
            }
          })

          expect(effectFunc).toBeCalledTimes(0)
        },
      )

      test.each([[1], [2], [10]])(
        "Effect function should not be called after unsubscribe",
        (callCount) => {
          const s = source<string>("s")
          const c = computed(() => s.current())
          const effectFunc = jest.fn()
          const e = effect(c, effectFunc)
          e.unsubscribe()

          for (let i = 0; i < callCount; ++i) {
            s.change("sChanged" + i)
          }

          expect(effectFunc).toBeCalledTimes(0)
        },
      )
    })

    describe("One effect depends on two computed and transitively on one source", () => {
      // s <-- c1 <-- e
      //  \-- c2 <---/

      test.each([[1], [2], [10]])(
        "Effect function should be called after every source change",
        (callCount) => {
          const s = source<string>("s")
          const c1 = computed(() => s.current())
          const c2 = computed(() => s.current())
          const effectFunc = jest.fn()
          const e = effect(
            computed(() => [c1.current(), c2.current()]),
            effectFunc,
          )

          for (let i = 0; i < callCount; ++i) {
            s.change("sChanged" + i)
          }

          expect(effectFunc).toBeCalledTimes(callCount)
        },
      )

      test.each([[1], [2], [10]])(
        "Effect function should not be called once after batch end with source changes",
        (callCount) => {
          const s = source<string>("s")
          const c1 = computed(() => s.current())
          const c2 = computed(() => s.current())
          const effectFunc = jest.fn()

          batch(() => {
            const e = effect(
              computed(() => [c1.current(), c2.current()]),
              effectFunc,
            )
            for (let i = 0; i < callCount; ++i) {
              s.change("sChanged" + i)
            }
          })

          expect(effectFunc).toBeCalledTimes(0)
        },
      )

      test.each([[1], [2], [10]])(
        "Effect function should not be called after unsubscribe",
        (callCount) => {
          const s = source<string>("s")
          const c1 = computed(() => s.current())
          const c2 = computed(() => s.current())
          const effectFunc = jest.fn()
          const e = effect(
            computed(() => [c1.current(), c2.current()]),
            effectFunc,
          )
          e.unsubscribe()

          for (let i = 0; i < callCount; ++i) {
            s.change("sChanged" + i)
          }

          expect(effectFunc).toBeCalledTimes(0)
        },
      )
    })
  })
})
