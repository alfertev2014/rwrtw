import { describe, expect, test } from "@jest/globals"
import {
  type Placeholder,
  createChildPlaceholderAt,
  createRootPlaceholderAt,
  placeAtBeginningOf,
  insertNodeAt,
} from ".."

describe("Placeholder", () => {
  describe("Create root placeholder inside regular DOM Node", () => {
    test("with empty content should do nothing with DOM", () => {
      const parent = document.createElement("div")
      const place = placeAtBeginningOf(parent)

      const placeholder = createRootPlaceholderAt(place, null)

      expect(placeholder.lastPlaceNode()).toBe(place)
      expect(parent.childNodes.length).toBe(0)
    })

    test("with one child Node should insert this node at place", () => {
      const parent = document.createElement("div")
      const place = placeAtBeginningOf(parent)
      const node = document.createElement("div")

      const placeholder = createRootPlaceholderAt(place, (place) => insertNodeAt(place, node))

      expect(placeholder.lastPlaceNode()).toBe(node)
      expect(node.parentNode).toBe(parent)
      expect(parent.firstChild).toBe(node)
    })

    test("with several Nodes in content should insert it in DOM", () => {
      const parent = document.createElement("div")
      const place = placeAtBeginningOf(parent)
      let node: Node = document.createElement("div")
      const firstNode = node

      const NODES_COUNT = 10

      const placeholder = createRootPlaceholderAt(place, (place) => {
        insertNodeAt(place, node)
        for (let i = 1; i < NODES_COUNT; ++i) {
          node = insertNodeAt(node, document.createTextNode("some text"))
        }
        return node
      })

      expect(placeholder.lastPlaceNode()).toBe(node)
      expect(firstNode.parentNode).toBe(parent)
      expect(node.parentNode).toBe(parent)
      expect(parent.firstChild).toBe(firstNode)
      expect(parent.childNodes.length).toBe(NODES_COUNT)
    })
  })

  describe("Create child placeholder", () => {
    test("at start of placeholder should be at starting place", () => {
      const parent = document.createElement("div")
      const place = placeAtBeginningOf(parent)
      let childPlaceholder: Placeholder | undefined

      createRootPlaceholderAt(place, (place, context) => {
        childPlaceholder = createChildPlaceholderAt(place, context, null)
        return childPlaceholder
      })

      expect(childPlaceholder?.lastPlaceNode()).toBe(place)
      expect(parent.childNodes.length).toBe(0)
    })

    test("with content should insert the content into parent", () => {
      const parent = document.createElement("div")
      const place = placeAtBeginningOf(parent)
      let childPlaceholder: Placeholder | undefined
      let innerNode: Node | undefined

      const parentPlaceholder = createRootPlaceholderAt(place, (place, context) => {
        childPlaceholder = createChildPlaceholderAt(place, context, (place) => {
          innerNode = insertNodeAt(place, document.createElement("div"))
          return innerNode
        })
        return childPlaceholder
      })

      expect(childPlaceholder?.lastPlaceNode()).toBe(innerNode)
      expect(parentPlaceholder.lastPlaceNode()).toBe(innerNode)
      expect(parent.childNodes.length).toBe(1)
      expect(parent.firstChild).toBe(innerNode)
    })

    test("with content twice should insert the content into parent", () => {
      const parent = document.createElement("div")
      const place = placeAtBeginningOf(parent)
      let childPlaceholder1: Placeholder | undefined
      let childPlaceholder2: Placeholder | undefined
      let innerNode1: Node | undefined
      let innerNode2: Node | undefined

      const parentPlaceholder = createRootPlaceholderAt(place, (place, context) => {
        childPlaceholder1 = createChildPlaceholderAt(place, context, (place) => {
          innerNode1 = insertNodeAt(place, document.createElement("div"))
          return innerNode1
        })
        childPlaceholder2 = createChildPlaceholderAt(childPlaceholder1, context, (place) => {
          innerNode2 = insertNodeAt(place, document.createElement("div"))
          return innerNode2
        })
        return childPlaceholder2
      })

      expect(parent.childNodes.length).toBe(2)
      expect(parent.firstChild).toBe(innerNode1)
      expect(parent.lastChild).toBe(innerNode2)
      expect(childPlaceholder1?.lastPlaceNode()).toBe(innerNode1)
      expect(childPlaceholder2?.lastPlaceNode()).toBe(innerNode2)

      expect(parentPlaceholder.lastPlaceNode()).toBe(innerNode2)
    })
  })

  describe("Replace placeholder content", () => {
    test("instead of empty should insert new content and correct dom place of parent placeholder", () => {
      const parent = document.createElement("div")
      const place = placeAtBeginningOf(parent)
      let childPlaceholder: Placeholder | undefined
      let innerNode: Node | undefined

      const parentPlaceholder = createRootPlaceholderAt(place, (place, context) => {
        childPlaceholder = createChildPlaceholderAt(place, context, null)
        return childPlaceholder
      })

      childPlaceholder?.replaceContent((place) => {
        innerNode = insertNodeAt(place, document.createElement("div"))
        return innerNode
      })

      expect(parent.childNodes.length).toBe(1)
      expect(parent.firstChild).toBe(innerNode)

      expect(childPlaceholder?.lastPlaceNode()).toBe(innerNode)
      expect(parentPlaceholder.lastPlaceNode()).toBe(innerNode)
    })

    test("instead of nodes should insert new content and correct dom place of parent placeholder", () => {
      const parent = document.createElement("div")
      const place = placeAtBeginningOf(parent)
      let childPlaceholder: Placeholder | undefined
      let oldNode: Node | undefined
      let innerNode: Node | undefined

      const parentPlaceholder = createRootPlaceholderAt(place, (place, context) => {
        childPlaceholder = createChildPlaceholderAt(place, context, (place) => {
          oldNode = insertNodeAt(place, document.createElement("div"))
          return oldNode
        })
        return childPlaceholder
      })

      childPlaceholder?.replaceContent((place) => {
        innerNode = insertNodeAt(place, document.createElement("div"))
        return innerNode
      })

      expect(parent.childNodes.length).toBe(1)
      expect(parent.firstChild).toBe(innerNode)

      expect(childPlaceholder?.lastPlaceNode()).toBe(innerNode)
      expect(parentPlaceholder.lastPlaceNode()).toBe(innerNode)
    })

    test("empty content instead of nodes should remove old content and correct dom place of parent placeholder", () => {
      const parent = document.createElement("div")
      const place = placeAtBeginningOf(parent)
      let childPlaceholder: Placeholder | undefined
      let oldNode: Node | undefined

      const parentPlaceholder = createRootPlaceholderAt(place, (place, context) => {
        childPlaceholder = createChildPlaceholderAt(place, context, (place) => {
          oldNode = insertNodeAt(place, document.createElement("div"))
          return oldNode
        })
        return childPlaceholder
      })

      childPlaceholder?.replaceContent(null)

      expect(parent.firstChild).toBeNull()

      expect(childPlaceholder?.lastPlaceNode()).toBe(place)
      expect(parentPlaceholder.lastPlaceNode()).toBe(place)
    })

    test("removing content of last child placeholder should correct parent last place node to first child placeholder", () => {
      const parent = document.createElement("div")
      const place = placeAtBeginningOf(parent)
      let childPlaceholder1: Placeholder | undefined
      let childPlaceholder2: Placeholder | undefined
      let innerNode1: Node | undefined
      let innerNode2: Node | undefined

      const parentPlaceholder = createRootPlaceholderAt(place, (place, context) => {
        childPlaceholder1 = createChildPlaceholderAt(place, context, (place) => {
          innerNode1 = insertNodeAt(place, document.createElement("div"))
          return innerNode1
        })
        childPlaceholder2 = createChildPlaceholderAt(childPlaceholder1, context, (place) => {
          innerNode2 = insertNodeAt(place, document.createElement("div"))
          return innerNode2
        })
        return childPlaceholder2
      })

      childPlaceholder2?.replaceContent(null)

      expect(parent.childNodes.length).toBe(1)
      expect(parent.firstChild).toBe(innerNode1)
      expect(childPlaceholder1?.lastPlaceNode()).toBe(innerNode1)
      expect(childPlaceholder2?.lastPlaceNode()).toBe(innerNode1)

      expect(parentPlaceholder.lastPlaceNode()).toBe(innerNode1)
    })

    test("removing content of first child placeholder should correct second's last place node to parent place", () => {
      const parent = document.createElement("div")
      const place = placeAtBeginningOf(parent)
      let childPlaceholder1: Placeholder | undefined
      let childPlaceholder2: Placeholder | undefined
      let innerNode1: Node | undefined
      let innerNode2: Node | undefined

      const parentPlaceholder = createRootPlaceholderAt(place, (place, context) => {
        childPlaceholder1 = createChildPlaceholderAt(place, context, (place) => {
          innerNode1 = insertNodeAt(place, document.createElement("div"))
          return innerNode1
        })
        childPlaceholder2 = createChildPlaceholderAt(childPlaceholder1, context, (place) => {
          innerNode2 = insertNodeAt(place, document.createElement("div"))
          return innerNode2
        })
        return childPlaceholder2
      })

      childPlaceholder1?.replaceContent(null)

      expect(parent.childNodes.length).toBe(1)
      expect(parent.firstChild).toBe(innerNode2)
      expect(childPlaceholder1?.lastPlaceNode()).toBe(place)
      expect(childPlaceholder2?.lastPlaceNode()).toBe(innerNode2)

      expect(parentPlaceholder.lastPlaceNode()).toBe(innerNode2)
    })
  })

  describe("Lifecycles", () => {
    describe("Registration of one lifecycle", () => {
      test("should call handlers in order on placeholder's handler", () => {
        const parent = document.createElement("div")
        const place = placeAtBeginningOf(parent)
        const lifecycle = {
          mount: jest.fn(),
          unmount: jest.fn(),
          dispose: jest.fn()
        }

        const placeholder = createRootPlaceholderAt(place, (place, context) => {
          context.registerLifecycle(lifecycle)
          return place
        })

        expect(lifecycle.mount).toBeCalledTimes(0)
        expect(lifecycle.unmount).toBeCalledTimes(0)
        expect(lifecycle.dispose).toBeCalledTimes(0)
        
        placeholder.mount?.()
        expect(lifecycle.mount).toBeCalledTimes(1)
        expect(lifecycle.unmount).toBeCalledTimes(0)
        expect(lifecycle.dispose).toBeCalledTimes(0)

        placeholder.unmount?.()
        expect(lifecycle.mount).toBeCalledTimes(1)
        expect(lifecycle.unmount).toBeCalledTimes(1)
        expect(lifecycle.dispose).toBeCalledTimes(0)

        placeholder.dispose?.()
        expect(lifecycle.mount).toBeCalledTimes(1)
        expect(lifecycle.unmount).toBeCalledTimes(1)
        expect(lifecycle.dispose).toBeCalledTimes(1)
      })

      test("double registration should call handlers twice in order on placeholder's handler", () => {
        const parent = document.createElement("div")
        const place = placeAtBeginningOf(parent)
        const lifecycle = {
          mount: jest.fn(),
          unmount: jest.fn(),
          dispose: jest.fn()
        }

        const placeholder = createRootPlaceholderAt(place, (place, context) => {
          context.registerLifecycle(lifecycle)
          context.registerLifecycle(lifecycle)
          return place
        })

        expect(lifecycle.mount).toBeCalledTimes(0)
        expect(lifecycle.unmount).toBeCalledTimes(0)
        expect(lifecycle.dispose).toBeCalledTimes(0)
        
        placeholder.mount?.()
        expect(lifecycle.mount).toBeCalledTimes(2)
        expect(lifecycle.unmount).toBeCalledTimes(0)
        expect(lifecycle.dispose).toBeCalledTimes(0)

        placeholder.unmount?.()
        expect(lifecycle.mount).toBeCalledTimes(2)
        expect(lifecycle.unmount).toBeCalledTimes(2)
        expect(lifecycle.dispose).toBeCalledTimes(0)

        placeholder.dispose?.()
        expect(lifecycle.mount).toBeCalledTimes(2)
        expect(lifecycle.unmount).toBeCalledTimes(2)
        expect(lifecycle.dispose).toBeCalledTimes(2)
      })

      test("should call handlers in order on parent placeholder's handlers", () => {
        const parent = document.createElement("div")
        const place = placeAtBeginningOf(parent)
        const lifecycle = {
          mount: jest.fn(),
          unmount: jest.fn(),
          dispose: jest.fn()
        }

        let childPlaceholder: Placeholder | undefined

        const parentPlaceholder = createRootPlaceholderAt(place, (place, context) => {
          childPlaceholder = createChildPlaceholderAt(place, context, (place, context) => {
            context.registerLifecycle(lifecycle)
            return place
          })
          return childPlaceholder
        })
        
        expect(lifecycle.mount).toBeCalledTimes(0)
        expect(lifecycle.unmount).toBeCalledTimes(0)
        expect(lifecycle.dispose).toBeCalledTimes(0)

        parentPlaceholder.mount?.()
        expect(lifecycle.mount).toBeCalledTimes(1)
        expect(lifecycle.unmount).toBeCalledTimes(0)
        expect(lifecycle.dispose).toBeCalledTimes(0)

        parentPlaceholder.unmount?.()
        expect(lifecycle.mount).toBeCalledTimes(1)
        expect(lifecycle.unmount).toBeCalledTimes(1)
        expect(lifecycle.dispose).toBeCalledTimes(0)

        parentPlaceholder.dispose?.()
        expect(lifecycle.mount).toBeCalledTimes(1)
        expect(lifecycle.unmount).toBeCalledTimes(1)
        expect(lifecycle.dispose).toBeCalledTimes(1)
      })
    })

    describe("Lifecycle on replacing content", () => {
      test("should call unmmount and dispose for old content", () => {
        const parent = document.createElement("div")
        const place = placeAtBeginningOf(parent)
        const lifecycle = {
          mount: jest.fn(),
          unmount: jest.fn(),
          dispose: jest.fn()
        }

        const placeholder = createRootPlaceholderAt(place, (place, context) => {
          context.registerLifecycle(lifecycle)
          return place
        })        
        
        placeholder.mount?.()
        expect(lifecycle.mount).toBeCalledTimes(1)

        placeholder.replaceContent(null)

        expect(lifecycle.unmount).toBeCalledTimes(1)
        expect(lifecycle.dispose).toBeCalledTimes(1)

        expect(lifecycle.dispose.mock.invocationCallOrder[0]).toBeGreaterThan(lifecycle.unmount.mock.invocationCallOrder[0])
      })

      test("should call mount for new content", () => {
        const parent = document.createElement("div")
        const place = placeAtBeginningOf(parent)
        const lifecycle = {
          mount: jest.fn(),
          unmount: jest.fn(),
          dispose: jest.fn()
        }

        const placeholder = createRootPlaceholderAt(place, null)        
        
        placeholder.mount?.()

        placeholder.replaceContent((place, context) => {
          context.registerLifecycle(lifecycle)
          return place
        })

        expect(lifecycle.mount).toBeCalledTimes(1)
        expect(lifecycle.unmount).toBeCalledTimes(0)
        expect(lifecycle.dispose).toBeCalledTimes(0)
      })

      test("should call unmount and dispose for old content and mount for new content", () => {
        const parent = document.createElement("div")
        const place = placeAtBeginningOf(parent)
        const oldLifecycle = {
          mount: jest.fn(),
          unmount: jest.fn(),
          dispose: jest.fn()
        }
        
        const newLifecycle = {
          mount: jest.fn(),
          unmount: jest.fn(),
          dispose: jest.fn()
        }

        const placeholder = createRootPlaceholderAt(place, (place, context) => {
          context.registerLifecycle(oldLifecycle)
          return place
        })        
        
        placeholder.mount?.()

        placeholder.replaceContent((place, context) => {
          context.registerLifecycle(newLifecycle)
          return place
        })

        expect(oldLifecycle.unmount).toBeCalledTimes(1)
        expect(oldLifecycle.dispose).toBeCalledTimes(1)
        
        expect(newLifecycle.mount).toBeCalledTimes(1)

        expect(newLifecycle.mount.mock.invocationCallOrder[0]).toBeGreaterThan(oldLifecycle.unmount.mock.invocationCallOrder[0])
        expect(newLifecycle.mount.mock.invocationCallOrder[0]).toBeGreaterThan(oldLifecycle.dispose.mock.invocationCallOrder[0])
      })

      test("for child placeholder should call unmount and dispose for old content and mount for new content", () => {
        const parent = document.createElement("div")
        const place = placeAtBeginningOf(parent)
        const oldLifecycle = {
          mount: jest.fn(),
          unmount: jest.fn(),
          dispose: jest.fn()
        }
        
        const newLifecycle = {
          mount: jest.fn(),
          unmount: jest.fn(),
          dispose: jest.fn()
        }

        const placeholder = createRootPlaceholderAt(place, (place, context) => {
          const placeholder = createChildPlaceholderAt(place, context, (place, context) => {
            context.registerLifecycle(oldLifecycle)
            return place
          })
          return placeholder
        })        
        
        placeholder.mount?.()

        placeholder.replaceContent((place, context) => {
          context.registerLifecycle(newLifecycle)
          return place
        })

        expect(oldLifecycle.unmount).toBeCalledTimes(1)
        expect(oldLifecycle.dispose).toBeCalledTimes(1)
        
        expect(newLifecycle.mount).toBeCalledTimes(1)

        expect(newLifecycle.mount.mock.invocationCallOrder[0]).toBeGreaterThan(oldLifecycle.unmount.mock.invocationCallOrder[0])
        expect(newLifecycle.mount.mock.invocationCallOrder[0]).toBeGreaterThan(oldLifecycle.dispose.mock.invocationCallOrder[0])
      })
    })
  })
})
