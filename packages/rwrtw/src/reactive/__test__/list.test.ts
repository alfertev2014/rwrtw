import assert from "node:assert"
import test, { beforeEach, describe, mock, type Mock } from "node:test"
import { listSource, type ListObserver } from "../list.js"

describe("List", () => {
  let observer: {
    onInsert: Mock<ListObserver["onInsert"]>
    onMove: Mock<ListObserver["onMove"]>
    onRemove: Mock<ListObserver["onRemove"]>
  }

  beforeEach(() => {
    observer = {
      onInsert: mock.fn(),
      onMove: mock.fn(),
      onRemove: mock.fn(),
    }
  })

  describe("Initialize", () => {
    test("Empty list", () => {
      const l = listSource([])

      l.observer = observer

      assert.strictEqual(l.current().length, 0)
    })

    test("Non empty list", () => {
      const l = listSource<string>(["1", "2", "3"])

      l.observer = observer

      assert.strictEqual(l.current().length, 3)
      assert.strictEqual(l.current()[0].current(), "1")
      assert.strictEqual(l.current()[1].current(), "2")
      assert.strictEqual(l.current()[2].current(), "3")
    })
  })

  describe("Insert", () => {
    test("Insert item into empty list", () => {
      const l = listSource<string>([])
      l.observer = observer
      l.insertItem(0, "bla")

      assert.strictEqual(l.current().length, 1)
      assert.strictEqual(l.current()[0].current(), "bla")
      assert.strictEqual(observer.onInsert.mock.callCount(), 1)
      assert.strictEqual(observer.onInsert.mock.calls[0].arguments[0], 0)
      assert.strictEqual(
        observer.onInsert.mock.calls[0].arguments[1],
        l.current()[0],
      )
    })

    test("Insert item at index 0", () => {
      const l = listSource<string>(["1", "2"])
      l.observer = observer

      l.insertItem(0, "bla")

      assert.strictEqual(l.current().length, 3)
      assert.strictEqual(l.current()[0].current(), "bla")
      assert.strictEqual(l.current()[1].current(), "1")
      assert.strictEqual(l.current()[2].current(), "2")
      assert.strictEqual(observer.onInsert.mock.callCount(), 1)
      assert.strictEqual(observer.onInsert.mock.calls[0].arguments[0], 0)
      assert.strictEqual(
        observer.onInsert.mock.calls[0].arguments[1],
        l.current()[0],
      )
    })

    test("Insert item into the middle", () => {
      const l = listSource<string>(["1", "2"])
      l.observer = observer

      l.insertItem(1, "bla")

      assert.strictEqual(l.current().length, 3)
      assert.strictEqual(l.current()[0].current(), "1")
      assert.strictEqual(l.current()[1].current(), "bla")
      assert.strictEqual(l.current()[2].current(), "2")
      assert.strictEqual(observer.onInsert.mock.callCount(), 1)
      assert.strictEqual(observer.onInsert.mock.calls[0].arguments[0], 1)
      assert.strictEqual(
        observer.onInsert.mock.calls[0].arguments[1],
        l.current()[1],
      )
    })

    test("Insert item at the end", () => {
      const l = listSource<string>(["1", "2"])
      l.observer = observer

      l.insertItem(2, "bla")

      assert.strictEqual(l.current().length, 3)
      assert.strictEqual(l.current()[0].current(), "1")
      assert.strictEqual(l.current()[1].current(), "2")
      assert.strictEqual(l.current()[2].current(), "bla")
      assert.strictEqual(observer.onInsert.mock.callCount(), 1)
      assert.strictEqual(observer.onInsert.mock.calls[0].arguments[0], 2)
      assert.strictEqual(
        observer.onInsert.mock.calls[0].arguments[1],
        l.current()[2],
      )
    })
  })

  describe("Remove", () => {
    test("Remove the only element", () => {
      const l = listSource<string>(["bla"])
      l.observer = observer
      l.removeItem(0)

      assert.strictEqual(l.current().length, 0)
      assert.strictEqual(observer.onRemove.mock.callCount(), 1)
      assert.strictEqual(observer.onRemove.mock.calls[0].arguments[0], 0)
    })

    test("Remove item at index 0", () => {
      const l = listSource<string>(["1", "2", "3"])
      l.observer = observer

      l.removeItem(0)

      assert.strictEqual(l.current().length, 2)
      assert.strictEqual(l.current()[0].current(), "2")
      assert.strictEqual(l.current()[1].current(), "3")
      assert.strictEqual(observer.onRemove.mock.callCount(), 1)
      assert.strictEqual(observer.onRemove.mock.calls[0].arguments[0], 0)
    })

    test("Remove item into the middle", () => {
      const l = listSource<string>(["1", "2", "3"])
      l.observer = observer

      l.removeItem(1)

      assert.strictEqual(l.current().length, 2)
      assert.strictEqual(l.current()[0].current(), "1")
      assert.strictEqual(l.current()[1].current(), "3")
      assert.strictEqual(observer.onRemove.mock.callCount(), 1)
      assert.strictEqual(observer.onRemove.mock.calls[0].arguments[0], 1)
    })

    test("Remove item at the end", () => {
      const l = listSource<string>(["1", "2", "3"])
      l.observer = observer

      l.removeItem(2)

      assert.strictEqual(l.current().length, 2)
      assert.strictEqual(l.current()[0].current(), "1")
      assert.strictEqual(l.current()[1].current(), "2")
      assert.strictEqual(observer.onRemove.mock.callCount(), 1)
      assert.strictEqual(observer.onRemove.mock.calls[0].arguments[0], 2)
    })
  })

  describe("Move item", () => {
    test("Move to the same position", () => {
      const l = listSource<string>(["bla"])
      l.observer = observer
      l.moveItem(0, 0)

      assert.strictEqual(l.current().length, 1)
      assert.strictEqual(l.current()[0].current(), "bla")
      assert.strictEqual(observer.onMove.mock.callCount(), 0)
    })

    test("Move item to one position to the end", () => {
      const l = listSource<string>(["1", "2", "3"])
      l.observer = observer

      l.moveItem(0, 1)

      assert.strictEqual(l.current().length, 3)
      assert.strictEqual(l.current()[0].current(), "2")
      assert.strictEqual(l.current()[1].current(), "1")
      assert.strictEqual(l.current()[2].current(), "3")
      assert.strictEqual(observer.onMove.mock.callCount(), 1)
      assert.strictEqual(observer.onMove.mock.calls[0].arguments[0], 0)
      assert.strictEqual(observer.onMove.mock.calls[0].arguments[1], 1)
    })

    test("Move item to many positions to the end", () => {
      const l = listSource<string>(["1", "2", "3"])
      l.observer = observer

      l.moveItem(0, 2)

      assert.strictEqual(l.current().length, 3)
      assert.strictEqual(l.current()[0].current(), "2")
      assert.strictEqual(l.current()[1].current(), "3")
      assert.strictEqual(l.current()[2].current(), "1")
      assert.strictEqual(observer.onMove.mock.callCount(), 1)
      assert.strictEqual(observer.onMove.mock.calls[0].arguments[0], 0)
      assert.strictEqual(observer.onMove.mock.calls[0].arguments[1], 2)
    })

    test("Move item to one position to the beginning", () => {
      const l = listSource<string>(["1", "2", "3"])
      l.observer = observer

      l.moveItem(2, 1)

      assert.strictEqual(l.current().length, 3)
      assert.strictEqual(l.current()[0].current(), "1")
      assert.strictEqual(l.current()[1].current(), "3")
      assert.strictEqual(l.current()[2].current(), "2")
      assert.strictEqual(observer.onMove.mock.callCount(), 1)
      assert.strictEqual(observer.onMove.mock.calls[0].arguments[0], 2)
      assert.strictEqual(observer.onMove.mock.calls[0].arguments[1], 1)
    })

    test("Move item to many positions to the beginning", () => {
      const l = listSource<string>(["1", "2", "3"])
      l.observer = observer

      l.moveItem(2, 0)

      assert.strictEqual(l.current().length, 3)
      assert.strictEqual(l.current()[0].current(), "3")
      assert.strictEqual(l.current()[1].current(), "1")
      assert.strictEqual(l.current()[2].current(), "2")
      assert.strictEqual(observer.onMove.mock.callCount(), 1)
      assert.strictEqual(observer.onMove.mock.calls[0].arguments[0], 2)
      assert.strictEqual(observer.onMove.mock.calls[0].arguments[1], 0)
    })
  })

  describe("Apply new data", () => {
    test("Apply empty list", () => {
      const l = listSource([])

      l.observer = observer

      l.change([])

      assert.strictEqual(l.current().length, 0)
    })

    test("Clear with empty list", () => {
      const l = listSource(["1", "2", "3"])

      l.observer = observer

      l.change([])

      assert.strictEqual(l.current().length, 0)
      assert.strictEqual(observer.onRemove.mock.callCount(), 3)
      assert.strictEqual(observer.onRemove.mock.calls[0].arguments[0], 0)
    })

    test("Apply non empty list", () => {
      const l = listSource<string>([])

      l.observer = observer

      l.change(["1", "2", "3"])

      assert.strictEqual(l.current().length, 3)
      assert.strictEqual(l.current()[0].current(), "1")
      assert.strictEqual(l.current()[1].current(), "2")
      assert.strictEqual(l.current()[2].current(), "3")

      assert.strictEqual(observer.onInsert.mock.callCount(), 3)
      assert.strictEqual(observer.onInsert.mock.calls[0].arguments[0], 0)
      assert.strictEqual(
        observer.onInsert.mock.calls[0].arguments[1],
        l.current()[0],
      )
      assert.strictEqual(observer.onInsert.mock.calls[1].arguments[0], 1)
      assert.strictEqual(
        observer.onInsert.mock.calls[1].arguments[1],
        l.current()[1],
      )
      assert.strictEqual(observer.onInsert.mock.calls[2].arguments[0], 2)
      assert.strictEqual(
        observer.onInsert.mock.calls[2].arguments[1],
        l.current()[2],
      )
    })

    test("Apply the same list", () => {
      const l = listSource<string>(["1", "2", "3"])

      l.observer = observer

      l.change(["1", "2", "3"])

      assert.strictEqual(l.current().length, 3)
      assert.strictEqual(l.current()[0].current(), "1")
      assert.strictEqual(l.current()[1].current(), "2")
      assert.strictEqual(l.current()[2].current(), "3")
    })

    test("Apply list with swapped adjacent items", () => {
      const l = listSource<string>(["1", "2", "3"])

      l.observer = observer

      l.change(["2", "1", "3"])

      assert.strictEqual(l.current().length, 3)
      assert.strictEqual(l.current()[0].current(), "2")
      assert.strictEqual(l.current()[1].current(), "1")
      assert.strictEqual(l.current()[2].current(), "3")

      assert.strictEqual(observer.onMove.mock.callCount(), 1)
      assert.strictEqual(observer.onMove.mock.calls[0].arguments[0], 1)
      assert.strictEqual(observer.onMove.mock.calls[0].arguments[1], 0)
    })

    test("Apply list with moved item with shift", () => {
      const l = listSource<string>(["1", "2", "3"])

      l.observer = observer

      l.change(["3", "1", "2"])

      assert.strictEqual(l.current().length, 3)
      assert.strictEqual(l.current()[0].current(), "3")
      assert.strictEqual(l.current()[1].current(), "1")
      assert.strictEqual(l.current()[2].current(), "2")

      assert.strictEqual(observer.onMove.mock.callCount(), 1)
      assert.strictEqual(observer.onMove.mock.calls[0].arguments[0], 2)
      assert.strictEqual(observer.onMove.mock.calls[0].arguments[1], 0)
    })
  })
})
