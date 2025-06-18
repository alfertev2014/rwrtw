import assert from "node:assert"
import test, { describe, mock } from "node:test"
import { computed, effect, source, batch } from "../observable.js"
import type { PlainData } from "../../types.js"

describe("Observable", () => {
  describe("Source", () => {
    test("Creating source with value should store this value", () => {
      const value = "s"
      const s = source<string>(value)

      assert.strictEqual(s.current(), value)
    })

    test("Changing source value should change stored value", () => {
      const s = source<string>("s")

      const value = "sChanged"

      s.change(value)

      assert.strictEqual(s.current(), value)
    })
  })

  describe("Computed", () => {
    test("Creating computed value should not call compute function immediately", () => {
      const computeFunc = mock.fn<() => PlainData>()
      const c = computed(computeFunc)

      assert.strictEqual(computeFunc.mock.callCount(), 0)
    })

    test("Creating computed value without dependencies and getting its value should call computed function", () => {
      const computeFunc = mock.fn(() => 42)
      const c = computed(computeFunc)

      c.current()

      assert.strictEqual(computeFunc.mock.callCount(), 1)
    })

    test("Computed function should be called only once if dependencies not changed", (t) => {
      for (const callCount of [1, 2, 10]) {
        t.test(() => {
          const computeFunc = mock.fn(() => 42)
          const c = computed(computeFunc)

          for (let i = 0; i < callCount; ++i) {
            c.current()
          }

          assert.strictEqual(computeFunc.mock.callCount(), 1)
        })
      }
    })

    describe("Computing value", () => {
      const returnedValue = 42

      test("Computed value should return value which computed function returned", () => {
        const c = computed(() => returnedValue)

        assert.strictEqual(c.current(), returnedValue)
      })

      test("computed should return the cached value after first computing", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const c = computed(() => returnedValue)

            const values: unknown[] = []
            for (let i = 0; i < callCount; ++i) {
              values.push(c.current())
            }

            for (let i = 0; i < callCount; ++i) {
              assert.strictEqual(values[i], returnedValue)
            }
          })
        }
      })
    })
  })

  describe("Dependencies", () => {
    describe("One computed depends on one source", () => {
      // s <-- c

      test("should return computed value", () => {
        const s = source<string>("s")
        const c = computed(() => "c-" + s.current())

        assert.strictEqual(c.current(), "c-s")
      })

      test("should recalculate value if source changed", () => {
        const s = source<string>("s")
        const c = computed(() => "c-" + s.current())

        c.current()
        s.change("sChanged")

        assert.strictEqual(c.current(), "c-sChanged")
      })

      test("Computed function should not be called after source changed", () => {
        const s = source<string>("s")
        const computedFunc = mock.fn(() => "c-" + s.current())
        const c = computed(computedFunc)

        s.change("sChanged")

        assert.strictEqual(computedFunc.mock.callCount(), 0)
      })

      test("Computed function should be called when requesting current value", () => {
        const s = source<string>("s")
        const computedFunc = mock.fn(() => "c-" + s.current())
        const c = computed(computedFunc)

        s.change("sChanged")

        c.current()

        assert.strictEqual(computedFunc.mock.callCount(), 1)
      })

      test("Computed function should be called only once if source value changed to the same value", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = source<string>("s")
            const computedFunc = mock.fn(() => "c-" + s.current())
            const c = computed(computedFunc)
            c.current()

            for (let i = 0; i < callCount; ++i) {
              s.change("sChanged")
              c.current()
            }

            assert.strictEqual(computedFunc.mock.callCount(), 2)
          })
        }
      })

      test("Computed function should be called every time when source value changed to a different value", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = source<string>("s")
            const computedFunc = mock.fn(() => "c-" + s.current())
            const c = computed(computedFunc)
            c.current()

            for (let i = 0; i < callCount; ++i) {
              s.change(`sChanged${i}`)
              c.current()
            }

            assert.strictEqual(computedFunc.mock.callCount(), callCount + 1)
          })
        }
      })

      test("Computed function should be called when requesting current value even if source is used multiple times", () => {
        const s = source<string>("s")
        const computedFunc = mock.fn(() => "c-" + s.current() + s.current())
        const c = computed(computedFunc)

        s.change("sChanged")

        c.current()

        assert.strictEqual(computedFunc.mock.callCount(), 1)
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

        assert.strictEqual(c1.current(), "c1-sChanged")
        assert.strictEqual(c2.current(), "c2-sChanged")
      })

      test("Computed function should be called only if computed value called", () => {
        const s = source<string>("s")
        const computedFunc1 = mock.fn(() => "c1-" + s.current())
        const c1 = computed(computedFunc1)
        const computedFunc2 = mock.fn(() => "c2-" + s.current())
        const c2 = computed(computedFunc2)

        s.change("sChanged")
        c2.current()

        assert.strictEqual(computedFunc1.mock.callCount(), 0)
        assert.strictEqual(computedFunc2.mock.callCount(), 1)
      })
    })

    describe("Transitive dependency with one source and two computed", () => {
      // s <-- c1 <-- c2

      test("computed should return values returned by its computed functions", () => {
        const s = source<string>("s")
        const c1 = computed(() => "c1-" + s.current())
        const c2 = computed(() => "c2-" + c1.current())

        assert.strictEqual(c1.current(), "c1-s")
        assert.strictEqual(c2.current(), "c2-c1-s")
      })

      test("should recalculate transient dependency if source changed", () => {
        const s = source<string>("s")
        const c1 = computed(() => "c1-" + s.current())
        const c2 = computed(() => "c2-" + c1.current())

        c1.current()
        s.change("sChanged")

        assert.strictEqual(c1.current(), "c1-sChanged")
        assert.strictEqual(c2.current(), "c2-c1-sChanged")
      })

      test("should recalculate final computed if source changed", () => {
        const s = source<string>("s")
        const c1 = computed(() => "c1-" + s.current())
        const c2 = computed(() => "c2-" + c1.current())

        c1.current()
        c2.current()
        s.change("sChanged")

        assert.strictEqual(c1.current(), "c1-sChanged")
        assert.strictEqual(c2.current(), "c2-c1-sChanged")
      })

      test("Computed function should be called only if computed value called", () => {
        const s = source<string>("s")
        const computedFunc1 = mock.fn(() => "c1-" + s.current())
        const c1 = computed(computedFunc1)
        const computedFunc2 = mock.fn(() => "c2-" + c1.current())
        const c2 = computed(computedFunc2)

        s.change("sChanged")
        c1.current()

        assert.strictEqual(computedFunc1.mock.callCount(), 1)
        assert.strictEqual(computedFunc2.mock.callCount(), 0)

        c2.current()

        assert.strictEqual(computedFunc1.mock.callCount(), 1)
        assert.strictEqual(computedFunc2.mock.callCount(), 1)
      })

      test("Computed function should be called only once after source change", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = source<string>("s")
            const computedFunc1 = mock.fn(() => "c1-" + s.current())
            const c1 = computed(computedFunc1)
            const computedFunc2 = mock.fn(() => "c2-" + c1.current())
            const c2 = computed(computedFunc2)

            s.change("sChanged")

            for (let i = 0; i < callCount; ++i) {
              c2.current()
            }

            assert.strictEqual(computedFunc1.mock.callCount(), 1)
            assert.strictEqual(computedFunc2.mock.callCount(), 1)
          })
        }
      })
    })

    describe("One source, two transient computed and one dependent computed", () => {
      // s <-- c1 <-- c3
      //  \-- c2 <---/

      test("computed should return values returned by its computed functions", () => {
        const s = source<string>("s")
        const c1 = computed(() => "c1-" + s.current())
        const c2 = computed(() => "c2-" + s.current())
        const c3 = computed(() => `c3 ${c1.current()} ${c2.current()}`)

        assert.strictEqual(c1.current(), "c1-s")
        assert.strictEqual(c2.current(), "c2-s")
        assert.strictEqual(c3.current(), "c3 c1-s c2-s")
      })

      test("should recalculate if source changed", () => {
        const s = source<string>("s")
        const c1 = computed(() => "c1-" + s.current())
        const c2 = computed(() => "c2-" + s.current())
        const c3 = computed(() => `c3 ${c1.current()} ${c2.current()}`)

        c3.current()
        s.change("sChanged")

        assert.strictEqual(c1.current(), "c1-sChanged")
        assert.strictEqual(c2.current(), "c2-sChanged")
        assert.strictEqual(c3.current(), "c3 c1-sChanged c2-sChanged")
      })

      test("Computed function should be called only if computed value called", () => {
        const s = source<string>("s")
        const computedFunc1 = mock.fn(() => "c1-" + s.current())
        const c1 = computed(computedFunc1)
        const computedFunc2 = mock.fn(() => "c2-" + s.current())
        const c2 = computed(computedFunc2)
        const computedFunc3 = mock.fn(
          () => `c3 ${c1.current()} ${c2.current()}`,
        )
        const c3 = computed(computedFunc3)

        s.change("sChanged")
        c1.current()

        assert.strictEqual(computedFunc1.mock.callCount(), 1)
        assert.strictEqual(computedFunc2.mock.callCount(), 0)
        assert.strictEqual(computedFunc3.mock.callCount(), 0)

        c3.current()

        assert.strictEqual(computedFunc1.mock.callCount(), 1)
        assert.strictEqual(computedFunc2.mock.callCount(), 1)
        assert.strictEqual(computedFunc3.mock.callCount(), 1)
      })

      test("Computed function should be called only once after source change", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = source<string>("s")
            const computedFunc1 = mock.fn(() => "c1-" + s.current())
            const c1 = computed(computedFunc1)
            const computedFunc2 = mock.fn(() => "c2-" + s.current())
            const c2 = computed(computedFunc2)
            const computedFunc3 = mock.fn(
              () => `c3 ${c1.current()} ${c2.current()}`,
            )
            const c3 = computed(computedFunc3)

            s.change("sChanged")

            for (let i = 0; i < callCount; ++i) {
              c3.current()
            }

            assert.strictEqual(computedFunc1.mock.callCount(), 1)
            assert.strictEqual(computedFunc2.mock.callCount(), 1)
            assert.strictEqual(computedFunc3.mock.callCount(), 1)
          })
        }
      })
    })

    describe("One source, two dependent computed and third computed conditionally depends on second computed if first computed is falsy", () => {
      // s <-- c1 <---------- c3
      //  \-- c2 (if c1) <---/

      test("in true case computed should return values returned by its computed functions", () => {
        const s = source<string>("s")
        const c1 = computed(() => "c1-" + s.current())
        const c2 = computed(() =>
          s.current() !== "" ? "c2-" + s.current() : "",
        )
        const c3 = computed(
          () => `c3 ${c1.current() !== "" ? c2.current() : "false"}`,
        )

        assert.strictEqual(c1.current(), "c1-s")
        assert.strictEqual(c2.current(), "c2-s")
        assert.strictEqual(c3.current(), "c3 c2-s")
      })

      test("in false case computed should return values returned by its computed functions", () => {
        const s = source<string>("")
        const c1 = computed(() =>
          s.current() !== "" ? "c1-" + s.current() : "",
        )
        const c2 = computed(() => "c2-" + s.current())
        const c3 = computed(
          () => `c3 ${c1.current() !== "" ? c2.current() : "false"}`,
        )

        assert.strictEqual(c1.current(), "")
        assert.strictEqual(c2.current(), "c2-")
        assert.strictEqual(c3.current(), "c3 false")
      })

      test("should recalculate if source changed", () => {
        const s = source<string>("s")
        const c1 = computed(() =>
          s.current() !== "" ? "c1-" + s.current() : "",
        )
        const c2 = computed(() => "c2-" + s.current())
        const c3 = computed(
          () => `c3 ${c1.current() !== "" ? c2.current() : "false"}`,
        )

        c3.current()
        s.change("")

        assert.strictEqual(c1.current(), "")
        assert.strictEqual(c2.current(), "c2-")
        assert.strictEqual(c3.current(), "c3 false")
      })

      test("in true case computed function should be called only if computed value called", () => {
        const s = source<string>("s")
        const computedFunc1 = mock.fn(() =>
          s.current() !== "" ? "c1-" + s.current() : "",
        )
        const c1 = computed(computedFunc1)
        const computedFunc2 = mock.fn(() => "c2" + s.current())
        const c2 = computed(computedFunc2)
        const computedFunc3 = mock.fn(
          () => `c3 ${c1.current() !== "" ? c2.current() : "false"}`,
        )
        const c3 = computed(computedFunc3)

        s.change("sChanged")
        c1.current()

        assert.strictEqual(computedFunc1.mock.callCount(), 1)
        assert.strictEqual(computedFunc2.mock.callCount(), 0)
        assert.strictEqual(computedFunc3.mock.callCount(), 0)

        c3.current()

        assert.strictEqual(computedFunc1.mock.callCount(), 1)
        assert.strictEqual(computedFunc2.mock.callCount(), 1)
        assert.strictEqual(computedFunc3.mock.callCount(), 1)
      })

      test("in false case computed function should be called only if computed value called", () => {
        const s = source<string>("s")
        const computedFunc1 = mock.fn(() =>
          s.current() !== "" ? "c1-" + s.current() : "",
        )
        const c1 = computed(computedFunc1)
        const computedFunc2 = mock.fn(() => "c2" + s.current())
        const c2 = computed(computedFunc2)
        const computedFunc3 = mock.fn(
          () => `c3 ${c1.current() !== "" ? c2.current() : "false"}`,
        )
        const c3 = computed(computedFunc3)

        s.change("")
        c1.current()

        assert.strictEqual(computedFunc1.mock.callCount(), 1)
        assert.strictEqual(computedFunc2.mock.callCount(), 0)
        assert.strictEqual(computedFunc3.mock.callCount(), 0)

        c3.current()

        assert.strictEqual(computedFunc1.mock.callCount(), 1)
        assert.strictEqual(computedFunc2.mock.callCount(), 0)
        assert.strictEqual(computedFunc3.mock.callCount(), 1)
      })

      test("in false case after true case computed should unsubscribe from non needed dependency and and its compute function should not be called any more", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = source<string>("s")
            const computedFunc1 = mock.fn(() =>
              s.current() !== "" ? "c1-" + s.current() : "",
            )
            const c1 = computed(computedFunc1)
            const computedFunc2 = mock.fn(() => "c2" + s.current())
            const c2 = computed(computedFunc2)
            const computedFunc3 = mock.fn(
              () => `c3 ${c1.current() !== "" ? c2.current() : "false"}`,
            )
            const c3 = computed(computedFunc3)

            c3.current()

            assert.strictEqual(computedFunc1.mock.callCount(), 1)
            assert.strictEqual(computedFunc2.mock.callCount(), 1)
            assert.strictEqual(computedFunc3.mock.callCount(), 1)

            s.change("")

            for (let i = 0; i < callCount; ++i) {
              c3.current()
            }

            assert.strictEqual(computedFunc1.mock.callCount(), 2)
            assert.strictEqual(computedFunc2.mock.callCount(), 1)
            assert.strictEqual(computedFunc3.mock.callCount(), 2)
          })
        }
      })
    })
  })

  describe("Effects", () => {
    describe("One effect depends on one source", () => {
      // s <-- e

      test("Effect function should not be called after creation", () => {
        const s = source<string>("s")
        const effectFunc = mock.fn()
        const e = effect(s, effectFunc)

        assert.strictEqual(effectFunc.mock.callCount(), 0)
      })

      test("Effect function should not be called after batch end", () => {
        const effectFunc = mock.fn()
        batch(() => {
          const s = source<string>("s")
          const e = effect(s, effectFunc)

          assert.strictEqual(effectFunc.mock.callCount(), 0)
        })
        assert.strictEqual(effectFunc.mock.callCount(), 0)
      })

      test("Effect function should not be called for unsubscribed effect after batch end", () => {
        const effectFunc = mock.fn()
        batch(() => {
          const s = source<string>("s")
          const e = effect(s, effectFunc)

          assert.strictEqual(effectFunc.mock.callCount(), 0)

          e.unsubscribe()
        })
        assert.strictEqual(effectFunc.mock.callCount(), 0)
      })

      test("Effect function should be called after every source change", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = source<string>("s")
            const effectFunc = mock.fn()
            const e = effect(s, effectFunc)

            for (let i = 0; i < callCount; ++i) {
              s.change(`sChanged${i}`)
            }

            assert.strictEqual(effectFunc.mock.callCount(), callCount)
          })
        }
      })

      test("Effect function should not be called after batch end with source changes", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = source<string>("s")
            const effectFunc = mock.fn()

            batch(() => {
              const e = effect(s, effectFunc)
              for (let i = 0; i < callCount; ++i) {
                s.change(`sChanged${i}`)
              }
            })

            assert.strictEqual(effectFunc.mock.callCount(), 0)
          })
        }
      })

      test("Effect function should not be called after unsubscribe", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = source<string>("s")
            const effectFunc = mock.fn()
            const e = effect(s, effectFunc)
            e.unsubscribe()

            for (let i = 0; i < callCount; ++i) {
              s.change(`sChanged${i}`)
            }

            assert.strictEqual(effectFunc.mock.callCount(), 0)
          })
        }
      })
    })

    describe("One effect depends transitively on one source", () => {
      // s <-- c <-- e

      test("Effect function should be called after every source change", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = source<string>("s")
            const c = computed(() => s.current())
            const effectFunc = mock.fn()
            const e = effect(c, effectFunc)

            for (let i = 0; i < callCount; ++i) {
              s.change(`sChanged${i}`)
            }

            assert.strictEqual(effectFunc.mock.callCount(), callCount)
          })
        }
      })

      test("Effect function should not be called after batch end with source changes", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = source<string>("s")
            const c = computed(() => s.current())
            const effectFunc = mock.fn()

            batch(() => {
              const e = effect(c, effectFunc)
              for (let i = 0; i < callCount; ++i) {
                s.change(`sChanged${i}`)
              }
            })

            assert.strictEqual(effectFunc.mock.callCount(), 0)
          })
        }
      })

      test("Effect function should not be called after unsubscribe", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = source<string>("s")
            const c = computed(() => s.current())
            const effectFunc = mock.fn()
            const e = effect(c, effectFunc)
            e.unsubscribe()

            for (let i = 0; i < callCount; ++i) {
              s.change(`sChanged${i}`)
            }

            assert.strictEqual(effectFunc.mock.callCount(), 0)
          })
        }
      })
    })

    describe("One effect depends on two computed and transitively on one source", () => {
      // s <-- c1 <-- e
      //  \-- c2 <---/

      test("Effect function should be called after every source change", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = source<string>("s")
            const c1 = computed(() => s.current())
            const c2 = computed(() => s.current())
            const effectFunc = mock.fn()
            const e = effect(
              computed(() => [c1.current(), c2.current()]),
              effectFunc,
            )

            for (let i = 0; i < callCount; ++i) {
              s.change(`sChanged${i}`)
            }

            assert.strictEqual(effectFunc.mock.callCount(), callCount)
          })
        }
      })

      test("Effect function should not be called once after batch end with source changes", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = source<string>("s")
            const c1 = computed(() => s.current())
            const c2 = computed(() => s.current())
            const effectFunc = mock.fn()

            batch(() => {
              const e = effect(
                computed(() => [c1.current(), c2.current()]),
                effectFunc,
              )
              for (let i = 0; i < callCount; ++i) {
                s.change(`sChanged${i}`)
              }
            })

            assert.strictEqual(effectFunc.mock.callCount(), 0)
          })
        }
      })

      test("Effect function should not be called after unsubscribe", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = source<string>("s")
            const c1 = computed(() => s.current())
            const c2 = computed(() => s.current())
            const effectFunc = mock.fn()
            const e = effect(
              computed(() => [c1.current(), c2.current()]),
              effectFunc,
            )
            e.unsubscribe()

            for (let i = 0; i < callCount; ++i) {
              s.change(`sChanged${i}`)
            }

            assert.strictEqual(effectFunc.mock.callCount(), 0)
          })
        }
      })
    })
  })
})
