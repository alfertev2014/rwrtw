import assert from "node:assert"
import test, { describe, mock } from "node:test"
import { computed, effect, state, batch } from "../signal.js"
import type { ReactiveData } from "../types.js"

describe("Signal", () => {
  describe("State", () => {
    test("Creating state with value should store this value", () => {
      const value = "s"
      const s = state<string>(value)

      assert.strictEqual(s.get(), value)
    })

    test("Changing state value should change stored value", () => {
      const s = state<string>("s")

      const value = "sChanged"

      s.set(value)

      assert.strictEqual(s.get(), value)
    })
  })

  describe("Computed", () => {
    test("Creating computed value should not call compute function immediately", () => {
      const computeFunc = mock.fn<() => ReactiveData>()
      const c = computed(computeFunc)

      assert.strictEqual(computeFunc.mock.callCount(), 0)
    })

    test("Creating computed value without dependencies and getting its value should call computed function", () => {
      const computeFunc = mock.fn(() => 42)
      const c = computed(computeFunc)

      c.get()

      assert.strictEqual(computeFunc.mock.callCount(), 1)
    })

    test("Computed function should be called only once if dependencies not changed", (t) => {
      for (const callCount of [1, 2, 10]) {
        t.test(() => {
          const computeFunc = mock.fn(() => 42)
          const c = computed(computeFunc)

          for (let i = 0; i < callCount; ++i) {
            c.get()
          }

          assert.strictEqual(computeFunc.mock.callCount(), 1)
        })
      }
    })

    describe("Computing value", () => {
      const returnedValue = 42

      test("Computed value should return value which computed function returned", () => {
        const c = computed(() => returnedValue)

        assert.strictEqual(c.get(), returnedValue)
      })

      test("computed should return the cached value after first computing", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const c = computed(() => returnedValue)

            const values: unknown[] = []
            for (let i = 0; i < callCount; ++i) {
              values.push(c.get())
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
    describe("One computed depends on one state", () => {
      // s <-- c

      test("should return computed value", () => {
        const s = state<string>("s")
        const c = computed(() => "c-" + s.get())

        assert.strictEqual(c.get(), "c-s")
      })

      test("should recalculate value if state changed", () => {
        const s = state<string>("s")
        const c = computed(() => "c-" + s.get())

        c.get()
        s.set("sChanged")

        assert.strictEqual(c.get(), "c-sChanged")
      })

      test("Computed function should not be called after state changed", () => {
        const s = state<string>("s")
        const computedFunc = mock.fn(() => "c-" + s.get())
        const c = computed(computedFunc)

        s.set("sChanged")

        assert.strictEqual(computedFunc.mock.callCount(), 0)
      })

      test("Computed function should be called when requesting current value", () => {
        const s = state<string>("s")
        const computedFunc = mock.fn(() => "c-" + s.get())
        const c = computed(computedFunc)

        s.set("sChanged")

        c.get()

        assert.strictEqual(computedFunc.mock.callCount(), 1)
      })

      test("Computed function should be called only once if state value changed to the same value", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = state<string>("s")
            const computedFunc = mock.fn(() => "c-" + s.get())
            const c = computed(computedFunc)
            c.get()

            for (let i = 0; i < callCount; ++i) {
              s.set("sChanged")
              c.get()
            }

            assert.strictEqual(computedFunc.mock.callCount(), 2)
          })
        }
      })

      test("Computed function should be called every time when state value changed to a different value", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = state<string>("s")
            const computedFunc = mock.fn(() => "c-" + s.get())
            const c = computed(computedFunc)
            c.get()

            for (let i = 0; i < callCount; ++i) {
              s.set(`sChanged${i}`)
              c.get()
            }

            assert.strictEqual(computedFunc.mock.callCount(), callCount + 1)
          })
        }
      })

      test("Computed function should be called when requesting current value even if state is used multiple times", () => {
        const s = state<string>("s")
        const computedFunc = mock.fn(() => "c-" + s.get() + s.get())
        const c = computed(computedFunc)

        s.set("sChanged")

        c.get()

        assert.strictEqual(computedFunc.mock.callCount(), 1)
      })
    })

    describe("Two computed depends on one state", () => {
      //  s <-- c1
      //   \-- c2

      test("should recalculate if state changed", () => {
        const s = state<string>("s")
        const c1 = computed(() => "c1-" + s.get())
        const c2 = computed(() => "c2-" + s.get())

        c1.get()
        c2.get()
        s.set("sChanged")

        assert.strictEqual(c1.get(), "c1-sChanged")
        assert.strictEqual(c2.get(), "c2-sChanged")
      })

      test("Computed function should be called only if computed value called", () => {
        const s = state<string>("s")
        const computedFunc1 = mock.fn(() => "c1-" + s.get())
        const c1 = computed(computedFunc1)
        const computedFunc2 = mock.fn(() => "c2-" + s.get())
        const c2 = computed(computedFunc2)

        s.set("sChanged")
        c2.get()

        assert.strictEqual(computedFunc1.mock.callCount(), 0)
        assert.strictEqual(computedFunc2.mock.callCount(), 1)
      })
    })

    describe("Transitive dependency with one state and two computed", () => {
      // s <-- c1 <-- c2

      test("computed should return values returned by its computed functions", () => {
        const s = state<string>("s")
        const c1 = computed(() => "c1-" + s.get())
        const c2 = computed(() => "c2-" + c1.get())

        assert.strictEqual(c1.get(), "c1-s")
        assert.strictEqual(c2.get(), "c2-c1-s")
      })

      test("should recalculate transient dependency if state changed", () => {
        const s = state<string>("s")
        const c1 = computed(() => "c1-" + s.get())
        const c2 = computed(() => "c2-" + c1.get())

        c1.get()
        s.set("sChanged")

        assert.strictEqual(c1.get(), "c1-sChanged")
        assert.strictEqual(c2.get(), "c2-c1-sChanged")
      })

      test("should recalculate final computed if state changed", () => {
        const s = state<string>("s")
        const c1 = computed(() => "c1-" + s.get())
        const c2 = computed(() => "c2-" + c1.get())

        c1.get()
        c2.get()
        s.set("sChanged")

        assert.strictEqual(c1.get(), "c1-sChanged")
        assert.strictEqual(c2.get(), "c2-c1-sChanged")
      })

      test("Computed function should be called only if computed value called", () => {
        const s = state<string>("s")
        const computedFunc1 = mock.fn(() => "c1-" + s.get())
        const c1 = computed(computedFunc1)
        const computedFunc2 = mock.fn(() => "c2-" + c1.get())
        const c2 = computed(computedFunc2)

        s.set("sChanged")
        c1.get()

        assert.strictEqual(computedFunc1.mock.callCount(), 1)
        assert.strictEqual(computedFunc2.mock.callCount(), 0)

        c2.get()

        assert.strictEqual(computedFunc1.mock.callCount(), 1)
        assert.strictEqual(computedFunc2.mock.callCount(), 1)
      })

      test("Computed function should be called only once after state change", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = state<string>("s")
            const computedFunc1 = mock.fn(() => "c1-" + s.get())
            const c1 = computed(computedFunc1)
            const computedFunc2 = mock.fn(() => "c2-" + c1.get())
            const c2 = computed(computedFunc2)

            s.set("sChanged")

            for (let i = 0; i < callCount; ++i) {
              c2.get()
            }

            assert.strictEqual(computedFunc1.mock.callCount(), 1)
            assert.strictEqual(computedFunc2.mock.callCount(), 1)
          })
        }
      })
    })

    describe("One state, two transient computed and one dependent computed", () => {
      // s <-- c1 <-- c3
      //  \-- c2 <---/

      test("computed should return values returned by its computed functions", () => {
        const s = state<string>("s")
        const c1 = computed(() => "c1-" + s.get())
        const c2 = computed(() => "c2-" + s.get())
        const c3 = computed(() => `c3 ${c1.get()} ${c2.get()}`)

        assert.strictEqual(c1.get(), "c1-s")
        assert.strictEqual(c2.get(), "c2-s")
        assert.strictEqual(c3.get(), "c3 c1-s c2-s")
      })

      test("should recalculate if state changed", () => {
        const s = state<string>("s")
        const c1 = computed(() => "c1-" + s.get())
        const c2 = computed(() => "c2-" + s.get())
        const c3 = computed(() => `c3 ${c1.get()} ${c2.get()}`)

        c3.get()
        s.set("sChanged")

        assert.strictEqual(c1.get(), "c1-sChanged")
        assert.strictEqual(c2.get(), "c2-sChanged")
        assert.strictEqual(c3.get(), "c3 c1-sChanged c2-sChanged")
      })

      test("Computed function should be called only if computed value called", () => {
        const s = state<string>("s")
        const computedFunc1 = mock.fn(() => "c1-" + s.get())
        const c1 = computed(computedFunc1)
        const computedFunc2 = mock.fn(() => "c2-" + s.get())
        const c2 = computed(computedFunc2)
        const computedFunc3 = mock.fn(
          () => `c3 ${c1.get()} ${c2.get()}`,
        )
        const c3 = computed(computedFunc3)

        s.set("sChanged")
        c1.get()

        assert.strictEqual(computedFunc1.mock.callCount(), 1)
        assert.strictEqual(computedFunc2.mock.callCount(), 0)
        assert.strictEqual(computedFunc3.mock.callCount(), 0)

        c3.get()

        assert.strictEqual(computedFunc1.mock.callCount(), 1)
        assert.strictEqual(computedFunc2.mock.callCount(), 1)
        assert.strictEqual(computedFunc3.mock.callCount(), 1)
      })

      test("Computed function should be called only once after state change", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = state<string>("s")
            const computedFunc1 = mock.fn(() => "c1-" + s.get())
            const c1 = computed(computedFunc1)
            const computedFunc2 = mock.fn(() => "c2-" + s.get())
            const c2 = computed(computedFunc2)
            const computedFunc3 = mock.fn(
              () => `c3 ${c1.get()} ${c2.get()}`,
            )
            const c3 = computed(computedFunc3)

            s.set("sChanged")

            for (let i = 0; i < callCount; ++i) {
              c3.get()
            }

            assert.strictEqual(computedFunc1.mock.callCount(), 1)
            assert.strictEqual(computedFunc2.mock.callCount(), 1)
            assert.strictEqual(computedFunc3.mock.callCount(), 1)
          })
        }
      })
    })

    describe("One state, two dependent computed and third computed conditionally depends on second computed if first computed is falsy", () => {
      // s <-- c1 <---------- c3
      //  \-- c2 (if c1) <---/

      test("in true case computed should return values returned by its computed functions", () => {
        const s = state<string>("s")
        const c1 = computed(() => "c1-" + s.get())
        const c2 = computed(() =>
          s.get() !== "" ? "c2-" + s.get() : "",
        )
        const c3 = computed(
          () => `c3 ${c1.get() !== "" ? c2.get() : "false"}`,
        )

        assert.strictEqual(c1.get(), "c1-s")
        assert.strictEqual(c2.get(), "c2-s")
        assert.strictEqual(c3.get(), "c3 c2-s")
      })

      test("in false case computed should return values returned by its computed functions", () => {
        const s = state<string>("")
        const c1 = computed(() =>
          s.get() !== "" ? "c1-" + s.get() : "",
        )
        const c2 = computed(() => "c2-" + s.get())
        const c3 = computed(
          () => `c3 ${c1.get() !== "" ? c2.get() : "false"}`,
        )

        assert.strictEqual(c1.get(), "")
        assert.strictEqual(c2.get(), "c2-")
        assert.strictEqual(c3.get(), "c3 false")
      })

      test("should recalculate if state changed", () => {
        const s = state<string>("s")
        const c1 = computed(() =>
          s.get() !== "" ? "c1-" + s.get() : "",
        )
        const c2 = computed(() => "c2-" + s.get())
        const c3 = computed(
          () => `c3 ${c1.get() !== "" ? c2.get() : "false"}`,
        )

        c3.get()
        s.set("")

        assert.strictEqual(c1.get(), "")
        assert.strictEqual(c2.get(), "c2-")
        assert.strictEqual(c3.get(), "c3 false")
      })

      test("in true case computed function should be called only if computed value called", () => {
        const s = state<string>("s")
        const computedFunc1 = mock.fn(() =>
          s.get() !== "" ? "c1-" + s.get() : "",
        )
        const c1 = computed(computedFunc1)
        const computedFunc2 = mock.fn(() => "c2" + s.get())
        const c2 = computed(computedFunc2)
        const computedFunc3 = mock.fn(
          () => `c3 ${c1.get() !== "" ? c2.get() : "false"}`,
        )
        const c3 = computed(computedFunc3)

        s.set("sChanged")
        c1.get()

        assert.strictEqual(computedFunc1.mock.callCount(), 1)
        assert.strictEqual(computedFunc2.mock.callCount(), 0)
        assert.strictEqual(computedFunc3.mock.callCount(), 0)

        c3.get()

        assert.strictEqual(computedFunc1.mock.callCount(), 1)
        assert.strictEqual(computedFunc2.mock.callCount(), 1)
        assert.strictEqual(computedFunc3.mock.callCount(), 1)
      })

      test("in false case computed function should be called only if computed value called", () => {
        const s = state<string>("s")
        const computedFunc1 = mock.fn(() =>
          s.get() !== "" ? "c1-" + s.get() : "",
        )
        const c1 = computed(computedFunc1)
        const computedFunc2 = mock.fn(() => "c2" + s.get())
        const c2 = computed(computedFunc2)
        const computedFunc3 = mock.fn(
          () => `c3 ${c1.get() !== "" ? c2.get() : "false"}`,
        )
        const c3 = computed(computedFunc3)

        s.set("")
        c1.get()

        assert.strictEqual(computedFunc1.mock.callCount(), 1)
        assert.strictEqual(computedFunc2.mock.callCount(), 0)
        assert.strictEqual(computedFunc3.mock.callCount(), 0)

        c3.get()

        assert.strictEqual(computedFunc1.mock.callCount(), 1)
        assert.strictEqual(computedFunc2.mock.callCount(), 0)
        assert.strictEqual(computedFunc3.mock.callCount(), 1)
      })

      test("in false case after true case computed should unsubscribe from non needed dependency and and its compute function should not be called any more", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = state<string>("s")
            const computedFunc1 = mock.fn(() =>
              s.get() !== "" ? "c1-" + s.get() : "",
            )
            const c1 = computed(computedFunc1)
            const computedFunc2 = mock.fn(() => "c2" + s.get())
            const c2 = computed(computedFunc2)
            const computedFunc3 = mock.fn(
              () => `c3 ${c1.get() !== "" ? c2.get() : "false"}`,
            )
            const c3 = computed(computedFunc3)

            c3.get()

            assert.strictEqual(computedFunc1.mock.callCount(), 1)
            assert.strictEqual(computedFunc2.mock.callCount(), 1)
            assert.strictEqual(computedFunc3.mock.callCount(), 1)

            s.set("")

            for (let i = 0; i < callCount; ++i) {
              c3.get()
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
    describe("One effect depends on one state", () => {
      // s <-- e

      test("Effect function should not be called after creation", () => {
        const s = state<string>("s")
        const effectFunc = mock.fn()
        const e = effect(s, effectFunc)

        assert.strictEqual(effectFunc.mock.callCount(), 0)
      })

      test("Effect function should not be called after batch end", () => {
        const effectFunc = mock.fn()
        batch(() => {
          const s = state<string>("s")
          const e = effect(s, effectFunc)

          assert.strictEqual(effectFunc.mock.callCount(), 0)
        })
        assert.strictEqual(effectFunc.mock.callCount(), 0)
      })

      test("Effect function should not be called for unsubscribed effect after batch end", () => {
        const effectFunc = mock.fn()
        batch(() => {
          const s = state<string>("s")
          const e = effect(s, effectFunc)

          assert.strictEqual(effectFunc.mock.callCount(), 0)

          e.unsubscribe()
        })
        assert.strictEqual(effectFunc.mock.callCount(), 0)
      })

      test("Effect function should be called after every state change", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = state<string>("s")
            const effectFunc = mock.fn()
            const e = effect(s, effectFunc)

            for (let i = 0; i < callCount; ++i) {
              s.set(`sChanged${i}`)
            }

            assert.strictEqual(effectFunc.mock.callCount(), callCount)
          })
        }
      })

      test("Effect function should be called after batch end with state changes", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = state<string>("s")
            const effectFunc = mock.fn()

            const e = effect(s, effectFunc)

            batch(() => {
              for (let i = 0; i < callCount; ++i) {
                s.set(`sChanged${i}`)
              }
            })

            assert.strictEqual(effectFunc.mock.callCount(), 1)
          })
        }
      })

      test("Effect function should not be called after unsubscribe", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = state<string>("s")
            const effectFunc = mock.fn()
            const e = effect(s, effectFunc)
            e.unsubscribe()

            for (let i = 0; i < callCount; ++i) {
              s.set(`sChanged${i}`)
            }

            assert.strictEqual(effectFunc.mock.callCount(), 0)
          })
        }
      })
    })

    describe("One effect depends transitively on one state", () => {
      // s <-- c <-- e

      test("Effect function should be called after every state change", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = state<string>("s")
            const c = computed(() => s.get())
            const effectFunc = mock.fn()
            const e = effect(c, effectFunc)

            for (let i = 0; i < callCount; ++i) {
              s.set(`sChanged${i}`)
            }

            assert.strictEqual(effectFunc.mock.callCount(), callCount)
          })
        }
      })

      test("Effect function should be called after batch end with state changes", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = state<string>("s")
            const c = computed(() => s.get())
            const effectFunc = mock.fn()

            const e = effect(c, effectFunc)

            batch(() => {
              for (let i = 0; i < callCount; ++i) {
                s.set(`sChanged${i}`)
              }
            })

            assert.strictEqual(effectFunc.mock.callCount(), 1)
          })
        }
      })

      test("Effect function should not be called after unsubscribe", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = state<string>("s")
            const c = computed(() => s.get())
            const effectFunc = mock.fn()
            const e = effect(c, effectFunc)
            e.unsubscribe()

            for (let i = 0; i < callCount; ++i) {
              s.set(`sChanged${i}`)
            }

            assert.strictEqual(effectFunc.mock.callCount(), 0)
          })
        }
      })
    })

    describe("One effect depends on two computed and transitively on one state", () => {
      // s <-- c1 <-- e
      //  \-- c2 <---/

      test("Effect function should be called after every state change", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = state<string>("s")
            const c1 = computed(() => s.get())
            const c2 = computed(() => s.get())
            const effectFunc = mock.fn()
            const e = effect(
              computed(() => [c1.get(), c2.get()]),
              effectFunc,
            )

            for (let i = 0; i < callCount; ++i) {
              s.set(`sChanged${i}`)
            }

            assert.strictEqual(effectFunc.mock.callCount(), callCount)
          })
        }
      })

      test("Effect function should be called once after batch end with state changes", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = state<string>("s")
            const c1 = computed(() => s.get())
            const c2 = computed(() => s.get())
            const effectFunc = mock.fn()

            const e = effect(
              computed(() => [c1.get(), c2.get()]),
              effectFunc,
            )

            batch(() => {
              for (let i = 0; i < callCount; ++i) {
                s.set(`sChanged${i}`)
              }
            })

            assert.strictEqual(effectFunc.mock.callCount(), 1)
          })
        }
      })

      test("Effect function should not be called after unsubscribe", (t) => {
        for (const callCount of [1, 2, 10]) {
          t.test(() => {
            const s = state<string>("s")
            const c1 = computed(() => s.get())
            const c2 = computed(() => s.get())
            const effectFunc = mock.fn()
            const e = effect(
              computed(() => [c1.get(), c2.get()]),
              effectFunc,
            )
            e.unsubscribe()

            for (let i = 0; i < callCount; ++i) {
              s.set(`sChanged${i}`)
            }

            assert.strictEqual(effectFunc.mock.callCount(), 0)
          })
        }
      })
    })
  })
})
