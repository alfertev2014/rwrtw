import { jest, describe, expect, test, beforeEach } from "@jest/globals"
import {
  type Placeholder,
  createRootPlaceholderAt,
  placeAtBeginningOf,
  type DOMPlace,
} from ".."

describe("Placeholder", () => {
  let PARENT_NODE: HTMLElement
  let PARENT_PLACE: DOMPlace

  beforeEach(() => {
    PARENT_NODE = document.createElement("div")
    PARENT_PLACE = placeAtBeginningOf(PARENT_NODE)
  })

  describe("Create root placeholder inside regular DOM Node", () => {
    test("with empty content - should do nothing with DOM", () => {
      const placeholder = createRootPlaceholderAt(PARENT_PLACE, null)

      expect(placeholder.lastDOMPlace()).toBe(PARENT_PLACE)
      expect(PARENT_NODE.childNodes.length).toBe(0)
    })

    test("with one child Node - should insert this node at place", () => {
      const innerNode = document.createElement("div")

      const placeholder = createRootPlaceholderAt(PARENT_PLACE, (renderer) =>
        renderer.insertNode(innerNode),
      )

      expect(placeholder.lastDOMPlace()).toBe(innerNode)
      expect(innerNode.parentNode).toBe(PARENT_NODE)
      expect(PARENT_NODE.firstChild).toBe(innerNode)
    })

    test("with several Nodes in content - should insert it in DOM", () => {
      let node: Node = document.createElement("div")
      const firstNode = node

      const NODES_COUNT = 10

      const placeholder = createRootPlaceholderAt(PARENT_PLACE, (renderer) => {
        renderer.insertNode(node)
        for (let i = 1; i < NODES_COUNT; ++i) {
          node = renderer.insertNode(document.createTextNode("some text"))
        }
      })

      expect(placeholder.lastDOMPlace()).toBe(node)
      expect(firstNode.parentNode).toBe(PARENT_NODE)
      expect(node.parentNode).toBe(PARENT_NODE)
      expect(PARENT_NODE.firstChild).toBe(firstNode)
      expect(PARENT_NODE.childNodes.length).toBe(NODES_COUNT)
    })
  })

  describe("Create child placeholder", () => {
    test("at start of placeholder - should be at starting place", () => {
      let childPlaceholder: Placeholder | undefined

      createRootPlaceholderAt(PARENT_PLACE, (renderer) => {
        childPlaceholder = renderer.insertPlaceholder(null)
      })

      expect(childPlaceholder?.lastDOMPlace()).toBe(PARENT_PLACE)
      expect(PARENT_NODE.childNodes.length).toBe(0)
    })

    test("with content - should insert the content into parent", () => {
      let childPlaceholder: Placeholder | undefined
      let innerNode: Node | undefined

      const parentPlaceholder = createRootPlaceholderAt(PARENT_PLACE, (renderer) => {
        childPlaceholder = renderer.insertPlaceholder((renderer) => {
          innerNode = renderer.insertNode(document.createElement("div"))
        })
      })

      expect(childPlaceholder?.lastDOMPlace()).toBe(innerNode)
      expect(parentPlaceholder.lastDOMPlace()).toBe(innerNode)
      expect(PARENT_NODE.childNodes.length).toBe(1)
      expect(PARENT_NODE.firstChild).toBe(innerNode)
    })

    test("with two child placeholders - should insert the content of both into parent", () => {
      let childPlaceholder1: Placeholder | undefined
      let childPlaceholder2: Placeholder | undefined
      let innerNode1: Node | undefined
      let innerNode2: Node | undefined

      const parentPlaceholder = createRootPlaceholderAt(PARENT_PLACE, (renderer) => {
        childPlaceholder1 = renderer.insertPlaceholder((renderer) => {
          innerNode1 = renderer.insertNode(document.createElement("div"))
        })
        childPlaceholder2 = renderer.insertPlaceholder((renderer) => {
          innerNode2 = renderer.insertNode(document.createElement("div"))
        })
      })

      expect(PARENT_NODE.childNodes.length).toBe(2)
      expect(PARENT_NODE.firstChild).toBe(innerNode1)
      expect(PARENT_NODE.lastChild).toBe(innerNode2)
      expect(childPlaceholder1?.lastDOMPlace()).toBe(innerNode1)
      expect(childPlaceholder2?.lastDOMPlace()).toBe(innerNode2)

      expect(parentPlaceholder.lastDOMPlace()).toBe(innerNode2)
    })
  })

  describe("Replace placeholder content", () => {
    test("instead of empty - should insert new content and correct lastDOMPlace of parent placeholder", () => {
      let childPlaceholder: Placeholder | undefined
      let innerNode: Node | undefined

      const parentPlaceholder = createRootPlaceholderAt(PARENT_PLACE, (renderer) => {
        childPlaceholder = renderer.insertPlaceholder(null)
      })

      childPlaceholder?.replaceContent((renderer) => {
        innerNode = renderer.insertNode(document.createElement("div"))
      })

      expect(PARENT_NODE.childNodes.length).toBe(1)
      expect(PARENT_NODE.firstChild).toBe(innerNode)

      expect(childPlaceholder?.lastDOMPlace()).toBe(innerNode)
      expect(parentPlaceholder.lastDOMPlace()).toBe(innerNode)
    })

    test("instead of nodes - should insert new content and correct lastDOMPlace of parent placeholder", () => {
      let childPlaceholder: Placeholder | undefined
      let innerNode: Node | undefined

      const parentPlaceholder = createRootPlaceholderAt(PARENT_PLACE, (renderer) => {
        childPlaceholder = renderer.insertPlaceholder((renderer) => {
          renderer.insertNode(document.createElement("div"))
        })
      })

      childPlaceholder?.replaceContent((renderer) => {
        innerNode = renderer.insertNode(document.createElement("div"))
      })

      expect(PARENT_NODE.childNodes.length).toBe(1)
      expect(PARENT_NODE.firstChild).toBe(innerNode)

      expect(childPlaceholder?.lastDOMPlace()).toBe(innerNode)
      expect(parentPlaceholder.lastDOMPlace()).toBe(innerNode)
    })

    test("empty content instead of nodes - should remove old content and correct lastDOMPlace of parent placeholder", () => {
      let childPlaceholder: Placeholder | undefined

      const parentPlaceholder = createRootPlaceholderAt(PARENT_PLACE, (renderer) => {
        childPlaceholder = renderer.insertPlaceholder((renderer) => {
          renderer.insertNode(document.createElement("div"))
        })
      })

      childPlaceholder?.replaceContent(null)

      expect(PARENT_NODE.firstChild).toBeNull()

      expect(childPlaceholder?.lastDOMPlace()).toBe(PARENT_PLACE)
      expect(parentPlaceholder.lastDOMPlace()).toBe(PARENT_PLACE)
    })

    test("removing content of last child placeholder - should correct parent lastDOMPlace to first child placeholder", () => {
      let childPlaceholder1: Placeholder | undefined
      let childPlaceholder2: Placeholder | undefined
      let innerNode1: Node | undefined

      const parentPlaceholder = createRootPlaceholderAt(PARENT_PLACE, (renderer) => {
        childPlaceholder1 = renderer.insertPlaceholder((renderer) => {
          innerNode1 = renderer.insertNode(document.createElement("div"))
        })
        childPlaceholder2 = renderer.insertPlaceholder((renderer) => {
          renderer.insertNode(document.createElement("div"))
        })
      })

      childPlaceholder2?.replaceContent(null)

      expect(PARENT_NODE.childNodes.length).toBe(1)
      expect(PARENT_NODE.firstChild).toBe(innerNode1)
      expect(innerNode1?.nextSibling).toBeNull()
      expect(childPlaceholder1?.lastDOMPlace()).toBe(innerNode1)
      expect(childPlaceholder2?.lastDOMPlace()).toBe(innerNode1)

      expect(parentPlaceholder.lastDOMPlace()).toBe(innerNode1)
    })

    test("removing content of first child placeholder - should correct second's lastDOMPlace to parent place", () => {
      let childPlaceholder1: Placeholder | undefined
      let childPlaceholder2: Placeholder | undefined
      let innerNode2: Node | undefined

      const parentPlaceholder = createRootPlaceholderAt(PARENT_PLACE, (renderer) => {
        childPlaceholder1 = renderer.insertPlaceholder((renderer) => {
          renderer.insertNode(document.createElement("div"))
        })
        childPlaceholder2 = renderer.insertPlaceholder((renderer) => {
          innerNode2 = renderer.insertNode(document.createElement("div"))
        })
      })

      childPlaceholder1?.replaceContent(null)

      expect(PARENT_NODE.childNodes.length).toBe(1)
      expect(PARENT_NODE.firstChild).toBe(innerNode2)
      expect(childPlaceholder1?.lastDOMPlace()).toBe(PARENT_PLACE)
      expect(childPlaceholder2?.lastDOMPlace()).toBe(innerNode2)

      expect(parentPlaceholder.lastDOMPlace()).toBe(innerNode2)
    })
  })

  describe("Lifecycles", () => {
    let LIFECYCLE: {
      mount: jest.Mock<VoidFunction>
      unmount: jest.Mock<VoidFunction>
      dispose: jest.Mock<VoidFunction>
    }

    beforeEach(() => {
      LIFECYCLE = {
        mount: jest.fn<VoidFunction>(),
        unmount: jest.fn<VoidFunction>(),
        dispose: jest.fn<VoidFunction>(),
      }
    })

    describe("Registration of one lifecycle", () => {
      test("should call handlers in order on placeholder's handler", () => {
        const placeholder = createRootPlaceholderAt(PARENT_PLACE, (renderer) => {
          renderer.registerLifecycle(LIFECYCLE)
        })

        expect(LIFECYCLE.mount).toBeCalledTimes(0)
        expect(LIFECYCLE.unmount).toBeCalledTimes(0)
        expect(LIFECYCLE.dispose).toBeCalledTimes(0)

        placeholder.mount?.()
        expect(LIFECYCLE.mount).toBeCalledTimes(1)
        expect(LIFECYCLE.unmount).toBeCalledTimes(0)
        expect(LIFECYCLE.dispose).toBeCalledTimes(0)

        placeholder.unmount?.()
        expect(LIFECYCLE.mount).toBeCalledTimes(1)
        expect(LIFECYCLE.unmount).toBeCalledTimes(1)
        expect(LIFECYCLE.dispose).toBeCalledTimes(0)

        placeholder.dispose?.()
        expect(LIFECYCLE.mount).toBeCalledTimes(1)
        expect(LIFECYCLE.unmount).toBeCalledTimes(1)
        expect(LIFECYCLE.dispose).toBeCalledTimes(1)
      })

      test("double registration should call handlers twice in order on placeholder's handler", () => {
        const placeholder = createRootPlaceholderAt(PARENT_PLACE, (renderer) => {
          renderer.registerLifecycle(LIFECYCLE)
          renderer.registerLifecycle(LIFECYCLE)
        })

        expect(LIFECYCLE.mount).toBeCalledTimes(0)
        expect(LIFECYCLE.unmount).toBeCalledTimes(0)
        expect(LIFECYCLE.dispose).toBeCalledTimes(0)

        placeholder.mount?.()
        expect(LIFECYCLE.mount).toBeCalledTimes(2)
        expect(LIFECYCLE.unmount).toBeCalledTimes(0)
        expect(LIFECYCLE.dispose).toBeCalledTimes(0)

        placeholder.unmount?.()
        expect(LIFECYCLE.mount).toBeCalledTimes(2)
        expect(LIFECYCLE.unmount).toBeCalledTimes(2)
        expect(LIFECYCLE.dispose).toBeCalledTimes(0)

        placeholder.dispose?.()
        expect(LIFECYCLE.mount).toBeCalledTimes(2)
        expect(LIFECYCLE.unmount).toBeCalledTimes(2)
        expect(LIFECYCLE.dispose).toBeCalledTimes(2)
      })

      test("should call handlers in order on parent placeholder's handlers", () => {
        let childPlaceholder: Placeholder | undefined

        const parentPlaceholder = createRootPlaceholderAt(PARENT_PLACE, (renderer) => {
          childPlaceholder = renderer.insertPlaceholder((renderer) => {
            renderer.registerLifecycle(LIFECYCLE)
          })
          return childPlaceholder
        })

        expect(LIFECYCLE.mount).toBeCalledTimes(0)
        expect(LIFECYCLE.unmount).toBeCalledTimes(0)
        expect(LIFECYCLE.dispose).toBeCalledTimes(0)

        parentPlaceholder.mount?.()
        expect(LIFECYCLE.mount).toBeCalledTimes(1)
        expect(LIFECYCLE.unmount).toBeCalledTimes(0)
        expect(LIFECYCLE.dispose).toBeCalledTimes(0)

        parentPlaceholder.unmount?.()
        expect(LIFECYCLE.mount).toBeCalledTimes(1)
        expect(LIFECYCLE.unmount).toBeCalledTimes(1)
        expect(LIFECYCLE.dispose).toBeCalledTimes(0)

        parentPlaceholder.dispose?.()
        expect(LIFECYCLE.mount).toBeCalledTimes(1)
        expect(LIFECYCLE.unmount).toBeCalledTimes(1)
        expect(LIFECYCLE.dispose).toBeCalledTimes(1)
      })
    })

    describe("Lifecycle on replacing content", () => {
      test("should call unmount and dispose for old content", () => {
        const placeholder = createRootPlaceholderAt(PARENT_PLACE, (renderer) => {
          renderer.registerLifecycle(LIFECYCLE)
        })

        placeholder.mount?.()
        expect(LIFECYCLE.mount).toBeCalledTimes(1)

        placeholder.replaceContent(null)

        expect(LIFECYCLE.unmount).toBeCalledTimes(1)
        expect(LIFECYCLE.dispose).toBeCalledTimes(1)

        expect(LIFECYCLE.dispose.mock.invocationCallOrder[0]).toBeGreaterThan(
          LIFECYCLE.unmount.mock.invocationCallOrder[0],
        )
      })

      test("should call mount for new content", () => {
        const placeholder = createRootPlaceholderAt(PARENT_PLACE, null)

        placeholder.mount?.()

        placeholder.replaceContent((renderer) => {
          renderer.registerLifecycle(LIFECYCLE)
        })

        expect(LIFECYCLE.mount).toBeCalledTimes(1)
        expect(LIFECYCLE.unmount).toBeCalledTimes(0)
        expect(LIFECYCLE.dispose).toBeCalledTimes(0)
      })

      test("should call unmount and dispose for old content and mount for new content", () => {
        const oldLifecycle = LIFECYCLE

        const newLifecycle = {
          mount: jest.fn(),
          unmount: jest.fn(),
          dispose: jest.fn(),
        }

        const placeholder = createRootPlaceholderAt(PARENT_PLACE, (renderer) => {
          renderer.registerLifecycle(oldLifecycle)
        })

        placeholder.mount?.()

        placeholder.replaceContent((renderer) => {
          renderer.registerLifecycle(newLifecycle)
        })

        expect(oldLifecycle.unmount).toBeCalledTimes(1)
        expect(oldLifecycle.dispose).toBeCalledTimes(1)

        expect(newLifecycle.mount).toBeCalledTimes(1)

        expect(newLifecycle.mount.mock.invocationCallOrder[0]).toBeGreaterThan(
          oldLifecycle.unmount.mock.invocationCallOrder[0],
        )
        expect(newLifecycle.mount.mock.invocationCallOrder[0]).toBeGreaterThan(
          oldLifecycle.dispose.mock.invocationCallOrder[0],
        )
      })

      test("for child placeholder should call unmount and dispose for old content and mount for new content", () => {
        const oldLifecycle = LIFECYCLE

        const newLifecycle = {
          mount: jest.fn(),
          unmount: jest.fn(),
          dispose: jest.fn(),
        }

        const placeholder = createRootPlaceholderAt(PARENT_PLACE, (renderer) => {
          const placeholder = renderer.insertPlaceholder((renderer) => {
            renderer.registerLifecycle(oldLifecycle)
          })
          return placeholder
        })

        placeholder.mount?.()

        placeholder.replaceContent((renderer) => {
          renderer.registerLifecycle(newLifecycle)
        })

        expect(oldLifecycle.unmount).toBeCalledTimes(1)
        expect(oldLifecycle.dispose).toBeCalledTimes(1)

        expect(newLifecycle.mount).toBeCalledTimes(1)

        expect(newLifecycle.mount.mock.invocationCallOrder[0]).toBeGreaterThan(
          oldLifecycle.unmount.mock.invocationCallOrder[0],
        )
        expect(newLifecycle.mount.mock.invocationCallOrder[0]).toBeGreaterThan(
          oldLifecycle.dispose.mock.invocationCallOrder[0],
        )
      })
    })
  })
})
