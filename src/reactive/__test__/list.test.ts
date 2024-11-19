import { describe, expect, test } from "@jest/globals"
import { listSource } from '../list'

describe("List", () => {

  let observer: {
    onInsert: jest.Mock;
    onMove: jest.Mock;
    onRemove: jest.Mock;
  }

  beforeEach(() => {
    observer = {
      onInsert: jest.fn(),
      onMove: jest.fn(),
      onRemove: jest.fn()
    } 
  })

  describe("Initialize", () => {
    test("Empty list", () => {
      const l = listSource([])
      
      l.observer = observer
  
      expect(l.data.length).toBe(0)
    })

    test("Non empty list", () => {
      const l = listSource<string>(["1", "2", "3"])
      
      l.observer = observer
  
      expect(l.data.length).toBe(3)
      expect(l.data[0].current()).toBe("1")
      expect(l.data[1].current()).toBe("2")
      expect(l.data[2].current()).toBe("3")
    })
  })

  describe("Insert", () => {
    test("Insert item into empty list", () => {
      const l = listSource<string>([])
      l.observer = observer
      l.insertItem(0, "bla")

      expect(l.data.length).toBe(1)
      expect(l.data[0].current()).toBe("bla")
      expect(observer.onInsert).toBeCalledTimes(1)
      expect(observer.onInsert?.mock.calls[0][0]).toBe(0)
      expect(observer.onInsert?.mock.calls[0][1]).toBe(l.data[0])
    })

    test("Insert item at index 0", () => {
      const l = listSource<string>(["1", "2"])
      l.observer = observer

      l.insertItem(0, "bla")

      expect(l.data.length).toBe(3)
      expect(l.data[0].current()).toBe("bla")
      expect(l.data[1].current()).toBe("1")
      expect(l.data[2].current()).toBe("2")
      expect(observer.onInsert).toBeCalledTimes(1)
      expect(observer.onInsert?.mock.calls[0][0]).toBe(0)
      expect(observer.onInsert?.mock.calls[0][1]).toBe(l.data[0])
    })

    test("Insert item into the middle", () => {
      const l = listSource<string>(["1", "2"])
      l.observer = observer

      l.insertItem(1, "bla")

      expect(l.data.length).toBe(3)
      expect(l.data[0].current()).toBe("1")
      expect(l.data[1].current()).toBe("bla")
      expect(l.data[2].current()).toBe("2")
      expect(observer.onInsert).toBeCalledTimes(1)
      expect(observer.onInsert?.mock.calls[0][0]).toBe(1)
      expect(observer.onInsert?.mock.calls[0][1]).toBe(l.data[1])
    })

    test("Insert item at the end", () => {
      const l = listSource<string>(["1", "2"])
      l.observer = observer

      l.insertItem(2, "bla")

      expect(l.data.length).toBe(3)
      expect(l.data[0].current()).toBe("1")
      expect(l.data[1].current()).toBe("2")
      expect(l.data[2].current()).toBe("bla")
      expect(observer.onInsert).toBeCalledTimes(1)
      expect(observer.onInsert?.mock.calls[0][0]).toBe(2)
      expect(observer.onInsert?.mock.calls[0][1]).toBe(l.data[2])
    })
  })

  describe("Remove", () => {
    test("Remove the only element", () => {
      const l = listSource<string>(["bla"])
      l.observer = observer
      l.removeItem(0)

      expect(l.data.length).toBe(0)
      expect(observer.onRemove).toBeCalledTimes(1)
      expect(observer.onRemove?.mock.calls[0][0]).toBe(0)
    })

    test("Remove item at index 0", () => {
      const l = listSource<string>(["1", "2", "3"])
      l.observer = observer

      l.removeItem(0)

      expect(l.data.length).toBe(2)
      expect(l.data[0].current()).toBe("2")
      expect(l.data[1].current()).toBe("3")
      expect(observer.onRemove).toBeCalledTimes(1)
      expect(observer.onRemove?.mock.calls[0][0]).toBe(0)
    })

    test("Remove item into the middle", () => {
      const l = listSource<string>(["1", "2", "3"])
      l.observer = observer

      l.removeItem(1)

      expect(l.data.length).toBe(2)
      expect(l.data[0].current()).toBe("1")
      expect(l.data[1].current()).toBe("3")
      expect(observer.onRemove).toBeCalledTimes(1)
      expect(observer.onRemove?.mock.calls[0][0]).toBe(1)
    })

    test("Remove item at the end", () => {
      const l = listSource<string>(["1", "2", "3"])
      l.observer = observer

      l.removeItem(2)

      expect(l.data.length).toBe(2)
      expect(l.data[0].current()).toBe("1")
      expect(l.data[1].current()).toBe("2")
      expect(observer.onRemove).toBeCalledTimes(1)
      expect(observer.onRemove?.mock.calls[0][0]).toBe(2)
    })
  })

  describe("Move item", () => {
    test("Move to the same position", () => {
      const l = listSource<string>(["bla"])
      l.observer = observer
      l.moveItem(0, 0)

      expect(l.data.length).toBe(1)
      expect(l.data[0].current()).toBe("bla")
      expect(observer.onMove).toBeCalledTimes(0)
    })

    test("Move item to one position to the end", () => {
      const l = listSource<string>(["1", "2", "3"])
      l.observer = observer

      l.moveItem(0, 1)

      expect(l.data.length).toBe(3)
      expect(l.data[0].current()).toBe("2")
      expect(l.data[1].current()).toBe("1")
      expect(l.data[2].current()).toBe("3")
      expect(observer.onMove).toBeCalledTimes(1)
      expect(observer.onMove?.mock.calls[0][0]).toBe(0)
      expect(observer.onMove?.mock.calls[0][1]).toBe(1)
    })

    test("Move item to many positions to the end", () => {
      const l = listSource<string>(["1", "2", "3"])
      l.observer = observer

      l.moveItem(0, 2)

      expect(l.data.length).toBe(3)
      expect(l.data[0].current()).toBe("2")
      expect(l.data[1].current()).toBe("3")
      expect(l.data[2].current()).toBe("1")
      expect(observer.onMove).toBeCalledTimes(1)
      expect(observer.onMove?.mock.calls[0][0]).toBe(0)
      expect(observer.onMove?.mock.calls[0][1]).toBe(2)
    })

    test("Move item to one position to the beginning", () => {
      const l = listSource<string>(["1", "2", "3"])
      l.observer = observer

      l.moveItem(2, 1)

      expect(l.data.length).toBe(3)
      expect(l.data[0].current()).toBe("1")
      expect(l.data[1].current()).toBe("3")
      expect(l.data[2].current()).toBe("2")
      expect(observer.onMove).toBeCalledTimes(1)
      expect(observer.onMove?.mock.calls[0][0]).toBe(2)
      expect(observer.onMove?.mock.calls[0][1]).toBe(1)
    })

    test("Move item to many positions to the beginning", () => {
      const l = listSource<string>(["1", "2", "3"])
      l.observer = observer

      l.moveItem(2, 0)

      expect(l.data.length).toBe(3)
      expect(l.data[0].current()).toBe("3")
      expect(l.data[1].current()).toBe("1")
      expect(l.data[2].current()).toBe("2")
      expect(observer.onMove).toBeCalledTimes(1)
      expect(observer.onMove?.mock.calls[0][0]).toBe(2)
      expect(observer.onMove?.mock.calls[0][1]).toBe(0)
    })
  })

  describe("Apply new data", () => {

    test("Apply empty list", () => {
      const l = listSource([])
      
      l.observer = observer
  
      l.change([])
  
      expect(l.data.length).toBe(0)
    })

    test("Clear with empty list", () => {
      const l = listSource(["1", "2", "3"])
      
      l.observer = observer
  
      l.change([])
  
      expect(l.data.length).toBe(0)
      expect(observer.onRemove).toBeCalledTimes(3)
      expect(observer.onRemove).toBeCalledWith(0)
    })

    test("Apply non empty list", () => {
      const l = listSource<string>([])
      
      l.observer = observer
  
      l.change(["1", "2", "3"])
  
      expect(l.data.length).toBe(3)
      expect(l.data[0].current()).toBe("1")
      expect(l.data[1].current()).toBe("2")
      expect(l.data[2].current()).toBe("3")

      expect(observer.onInsert).toBeCalledTimes(3)
      expect(observer.onInsert?.mock.calls[0][0]).toBe(0)
      expect(observer.onInsert?.mock.calls[0][1]).toBe(l.data[0])
      expect(observer.onInsert?.mock.calls[1][0]).toBe(1)
      expect(observer.onInsert?.mock.calls[1][1]).toBe(l.data[1])
      expect(observer.onInsert?.mock.calls[2][0]).toBe(2)
      expect(observer.onInsert?.mock.calls[2][1]).toBe(l.data[2])
    })

    test("Apply the same list", () => {
      const l = listSource<string>(["1", "2", "3"])
      
      l.observer = observer
  
      l.change(["1", "2", "3"])
  
      expect(l.data.length).toBe(3)
      expect(l.data[0].current()).toBe("1")
      expect(l.data[1].current()).toBe("2")
      expect(l.data[2].current()).toBe("3")
    })

    test("Apply list with swapped adjacent items", () => {
      const l = listSource<string>(["1", "2", "3"])
      
      l.observer = observer
  
      l.change(["2", "1", "3"])
  
      expect(l.data.length).toBe(3)
      expect(l.data[0].current()).toBe("2")
      expect(l.data[1].current()).toBe("1")
      expect(l.data[2].current()).toBe("3")

      expect(observer.onMove).toBeCalledTimes(1)
      expect(observer.onMove?.mock.calls[0][0]).toBe(1)
      expect(observer.onMove?.mock.calls[0][1]).toBe(0)
    })

    test("Apply list with moved item with shift", () => {
      const l = listSource<string>(["1", "2", "3"])
      
      l.observer = observer
  
      l.change(["3", "1", "2"])
  
      expect(l.data.length).toBe(3)
      expect(l.data[0].current()).toBe("3")
      expect(l.data[1].current()).toBe("1")
      expect(l.data[2].current()).toBe("2")

      expect(observer.onMove).toBeCalledTimes(1)
      expect(observer.onMove?.mock.calls[0][0]).toBe(2)
      expect(observer.onMove?.mock.calls[0][1]).toBe(0)
    })
  })
})