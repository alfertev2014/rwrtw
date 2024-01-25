import { describe, expect, test } from "@jest/globals"
import { createSyncSignal } from "../syncSignal"

describe("Synchronous signals", () => {
  describe.each([[0], [1], [2], [10]])("Emitting a signal", (callCount) => {
    test("Calling empty signal should do nothing", () => {
      const signal = createSyncSignal<unknown>()

      expect(() => signal.emit("blabla")).not.toThrow()
    })

    test("Calling signal with one subscriber should call this subscriber", () => {
      const signal = createSyncSignal<unknown>()

      const handler = jest.fn()

      signal.subscribe(handler)

      for (let i = callCount; i > 0; --i) {
        signal.emit("blabla")
      }

      expect(handler).toBeCalledTimes(callCount)
    })

    test("Calling signal with arg should call subscriber with the same arg", () => {
      const signal = createSyncSignal<unknown>()

      const handler = jest.fn<unknown, unknown[]>()

      signal.subscribe(handler)

      const arg = {}

      for (let i = callCount; i > 0; --i) {
        signal.emit(arg)
      }

      expect(handler).toBeCalledTimes(callCount)
      for (let i = callCount - 1; i >= 0; --i) {
        expect(handler.mock.calls[i][0]).toBe(arg)
      }
    })

    test("Calling signal with multiple subscribers should call these subscribers", () => {
      const signal = createSyncSignal<unknown>()

      const handler1 = jest.fn()
      const handler2 = jest.fn()

      signal.subscribe(handler1)
      signal.subscribe(handler2)

      for (let i = callCount; i > 0; --i) {
        signal.emit("blabla")
      }

      expect(handler1).toBeCalledTimes(callCount)
      expect(handler2).toBeCalledTimes(callCount)
    })

    test("Calling signal with arg should call all subscribers with the same arg", () => {
      const signal = createSyncSignal<unknown>()

      const handler1 = jest.fn()
      const handler2 = jest.fn()

      signal.subscribe(handler1)
      signal.subscribe(handler2)

      const arg = {}

      for (let i = callCount; i > 0; --i) {
        signal.emit(arg)
      }

      expect(handler1).toBeCalledTimes(callCount)
      for (let i = callCount - 1; i >= 0; --i) {
        expect(handler1.mock.calls[i][0]).toBe(arg)
      }

      expect(handler2).toBeCalledTimes(callCount)
      for (let i = callCount - 1; i >= 0; --i) {
        expect(handler2.mock.calls[i][0]).toBe(arg)
      }
    })
  })

  describe("Unsubscribing", () => {
    test("Calling signal after unsubscribing of subscriber should not call this subscriber", () => {
      const signal = createSyncSignal<unknown>()

      const handler = jest.fn()

      signal.subscribe(handler)
      signal.unsubscribe(handler)

      signal.emit("blabla")

      expect(handler).toBeCalledTimes(0)
    })

    test("Calling signal after unsubscribing using unsubscriber of subscriber should not call this subscriber", () => {
      const signal = createSyncSignal<unknown>()

      const handler = jest.fn()

      const unsubscriber = signal.subscribe(handler)
      unsubscriber()

      signal.emit("blabla")

      expect(handler).toBeCalledTimes(0)
    })
  })
})
