import assert from "node:assert"
import test, { beforeEach, describe, mock, type Mock } from "node:test"
import {
  type Placeholder,
  createRootPlaceholderAt,
  placeAtBeginningOf,
  type DOMPlace,
} from "../index.js"

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

      assert.strictEqual(placeholder.lastDOMPlace(), PARENT_PLACE)
      assert.strictEqual(PARENT_NODE.childNodes.length, 0)
    })

    test("with one child Node - should insert this node at place", () => {
      const innerNode = document.createElement("div")

      const placeholder = createRootPlaceholderAt(PARENT_PLACE, (renderer) =>
        renderer.insertNode(innerNode),
      )

      assert.strictEqual(placeholder.lastDOMPlace(), innerNode)
      assert.strictEqual(innerNode.parentNode, PARENT_NODE)
      assert.strictEqual(PARENT_NODE.firstChild, innerNode)
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

      assert.strictEqual(placeholder.lastDOMPlace(), node)
      assert.strictEqual(firstNode.parentNode, PARENT_NODE)
      assert.strictEqual(node.parentNode, PARENT_NODE)
      assert.strictEqual(PARENT_NODE.firstChild, firstNode)
      assert.strictEqual(PARENT_NODE.childNodes.length, NODES_COUNT)
    })
  })

  describe("Create child placeholder", () => {
    test("at start of placeholder - should be at starting place", () => {
      let childPlaceholder: Placeholder | undefined

      createRootPlaceholderAt(PARENT_PLACE, (renderer) => {
        childPlaceholder = renderer.insertPlaceholder(null)
      })

      assert.strictEqual(childPlaceholder?.lastDOMPlace(), PARENT_PLACE)
      assert.strictEqual(PARENT_NODE.childNodes.length, 0)
    })

    test("with content - should insert the content into parent", () => {
      let childPlaceholder: Placeholder | undefined
      let innerNode: Node | undefined

      const parentPlaceholder = createRootPlaceholderAt(
        PARENT_PLACE,
        (renderer) => {
          childPlaceholder = renderer.insertPlaceholder((renderer) => {
            innerNode = renderer.insertNode(document.createElement("div"))
          })
        },
      )

      assert.strictEqual(childPlaceholder?.lastDOMPlace(), innerNode)
      assert.strictEqual(parentPlaceholder.lastDOMPlace(), innerNode)
      assert.strictEqual(PARENT_NODE.childNodes.length, 1)
      assert.strictEqual(PARENT_NODE.firstChild, innerNode)
    })

    test("with two child placeholders - should insert the content of both into parent", () => {
      let childPlaceholder1: Placeholder | undefined
      let childPlaceholder2: Placeholder | undefined
      let innerNode1: Node | undefined
      let innerNode2: Node | undefined

      const parentPlaceholder = createRootPlaceholderAt(
        PARENT_PLACE,
        (renderer) => {
          childPlaceholder1 = renderer.insertPlaceholder((renderer) => {
            innerNode1 = renderer.insertNode(document.createElement("div"))
          })
          childPlaceholder2 = renderer.insertPlaceholder((renderer) => {
            innerNode2 = renderer.insertNode(document.createElement("div"))
          })
        },
      )

      assert.strictEqual(PARENT_NODE.childNodes.length, 2)
      assert.strictEqual(PARENT_NODE.firstChild, innerNode1)
      assert.strictEqual(PARENT_NODE.lastChild, innerNode2)
      assert.strictEqual(childPlaceholder1?.lastDOMPlace(), innerNode1)
      assert.strictEqual(childPlaceholder2?.lastDOMPlace(), innerNode2)

      assert.strictEqual(parentPlaceholder.lastDOMPlace(), innerNode2)
    })
  })

  describe("Replace placeholder content", () => {
    test("instead of empty - should insert new content and correct lastDOMPlace of parent placeholder", () => {
      let childPlaceholder: Placeholder | undefined
      let innerNode: Node | undefined

      const parentPlaceholder = createRootPlaceholderAt(
        PARENT_PLACE,
        (renderer) => {
          childPlaceholder = renderer.insertPlaceholder(null)
        },
      )

      childPlaceholder?.replaceContent((renderer) => {
        innerNode = renderer.insertNode(document.createElement("div"))
      })

      assert.strictEqual(PARENT_NODE.childNodes.length, 1)
      assert.strictEqual(PARENT_NODE.firstChild, innerNode)

      assert.strictEqual(childPlaceholder?.lastDOMPlace(), innerNode)
      assert.strictEqual(parentPlaceholder.lastDOMPlace(), innerNode)
    })

    test("instead of nodes - should insert new content and correct lastDOMPlace of parent placeholder", () => {
      let childPlaceholder: Placeholder | undefined
      let innerNode: Node | undefined

      const parentPlaceholder = createRootPlaceholderAt(
        PARENT_PLACE,
        (renderer) => {
          childPlaceholder = renderer.insertPlaceholder((renderer) => {
            renderer.insertNode(document.createElement("div"))
          })
        },
      )

      childPlaceholder?.replaceContent((renderer) => {
        innerNode = renderer.insertNode(document.createElement("div"))
      })

      assert.strictEqual(PARENT_NODE.childNodes.length, 1)
      assert.strictEqual(PARENT_NODE.firstChild, innerNode)

      assert.strictEqual(childPlaceholder?.lastDOMPlace(), innerNode)
      assert.strictEqual(parentPlaceholder.lastDOMPlace(), innerNode)
    })

    test("empty content instead of nodes - should remove old content and correct lastDOMPlace of parent placeholder", () => {
      let childPlaceholder: Placeholder | undefined

      const parentPlaceholder = createRootPlaceholderAt(
        PARENT_PLACE,
        (renderer) => {
          childPlaceholder = renderer.insertPlaceholder((renderer) => {
            renderer.insertNode(document.createElement("div"))
          })
        },
      )

      childPlaceholder?.replaceContent(null)

      assert.strictEqual(PARENT_NODE.firstChild, null)

      assert.strictEqual(childPlaceholder?.lastDOMPlace(), PARENT_PLACE)
      assert.strictEqual(parentPlaceholder.lastDOMPlace(), PARENT_PLACE)
    })

    test("removing content of last child placeholder - should correct parent lastDOMPlace to first child placeholder", () => {
      let childPlaceholder1: Placeholder | undefined
      let childPlaceholder2: Placeholder | undefined
      let innerNode1: Node | undefined

      const parentPlaceholder = createRootPlaceholderAt(
        PARENT_PLACE,
        (renderer) => {
          childPlaceholder1 = renderer.insertPlaceholder((renderer) => {
            innerNode1 = renderer.insertNode(document.createElement("div"))
          })
          childPlaceholder2 = renderer.insertPlaceholder((renderer) => {
            renderer.insertNode(document.createElement("div"))
          })
        },
      )

      childPlaceholder2?.replaceContent(null)

      assert.strictEqual(PARENT_NODE.childNodes.length, 1)
      assert.strictEqual(PARENT_NODE.firstChild, innerNode1)
      assert.strictEqual(innerNode1?.nextSibling, null)
      assert.strictEqual(childPlaceholder1?.lastDOMPlace(), innerNode1)
      assert.strictEqual(childPlaceholder2?.lastDOMPlace(), innerNode1)

      assert.strictEqual(parentPlaceholder.lastDOMPlace(), innerNode1)
    })

    test("removing content of first child placeholder - should correct second's lastDOMPlace to parent place", () => {
      let childPlaceholder1: Placeholder | undefined
      let childPlaceholder2: Placeholder | undefined
      let innerNode2: Node | undefined

      const parentPlaceholder = createRootPlaceholderAt(
        PARENT_PLACE,
        (renderer) => {
          childPlaceholder1 = renderer.insertPlaceholder((renderer) => {
            renderer.insertNode(document.createElement("div"))
          })
          childPlaceholder2 = renderer.insertPlaceholder((renderer) => {
            innerNode2 = renderer.insertNode(document.createElement("div"))
          })
        },
      )

      childPlaceholder1?.replaceContent(null)

      assert.strictEqual(PARENT_NODE.childNodes.length, 1)
      assert.strictEqual(PARENT_NODE.firstChild, innerNode2)
      assert.strictEqual(childPlaceholder1?.lastDOMPlace(), PARENT_PLACE)
      assert.strictEqual(childPlaceholder2?.lastDOMPlace(), innerNode2)

      assert.strictEqual(parentPlaceholder.lastDOMPlace(), innerNode2)
    })
  })

  describe("Lifecycles", () => {
    let LIFECYCLE: {
      mount: Mock<VoidFunction>
      unmount: Mock<VoidFunction>
      dispose: Mock<VoidFunction>
    }

    beforeEach(() => {
      LIFECYCLE = {
        mount: mock.fn<VoidFunction>(),
        unmount: mock.fn<VoidFunction>(),
        dispose: mock.fn<VoidFunction>(),
      }
    })

    describe("Registration of one lifecycle", () => {
      test("should call handlers in order on placeholder's handler", () => {
        const placeholder = createRootPlaceholderAt(
          PARENT_PLACE,
          (renderer) => {
            renderer.registerLifecycle(LIFECYCLE)
          },
        )

        assert.strictEqual(LIFECYCLE.mount.mock.callCount(), 0)
        assert.strictEqual(LIFECYCLE.unmount.mock.callCount(), 0)
        assert.strictEqual(LIFECYCLE.dispose.mock.callCount(), 0)

        placeholder.mount?.()
        assert.strictEqual(LIFECYCLE.mount.mock.callCount(), 1)
        assert.strictEqual(LIFECYCLE.unmount.mock.callCount(), 0)
        assert.strictEqual(LIFECYCLE.dispose.mock.callCount(), 0)

        placeholder.unmount?.()
        assert.strictEqual(LIFECYCLE.mount.mock.callCount(), 1)
        assert.strictEqual(LIFECYCLE.unmount.mock.callCount(), 1)
        assert.strictEqual(LIFECYCLE.dispose.mock.callCount(), 0)

        placeholder.dispose?.()
        assert.strictEqual(LIFECYCLE.mount.mock.callCount(), 1)
        assert.strictEqual(LIFECYCLE.unmount.mock.callCount(), 1)
        assert.strictEqual(LIFECYCLE.dispose.mock.callCount(), 1)
      })

      test("double registration should call handlers twice in order on placeholder's handler", () => {
        const placeholder = createRootPlaceholderAt(
          PARENT_PLACE,
          (renderer) => {
            renderer.registerLifecycle(LIFECYCLE)
            renderer.registerLifecycle(LIFECYCLE)
          },
        )

        assert.strictEqual(LIFECYCLE.mount.mock.callCount(), 0)
        assert.strictEqual(LIFECYCLE.unmount.mock.callCount(), 0)
        assert.strictEqual(LIFECYCLE.dispose.mock.callCount(), 0)

        placeholder.mount?.()
        assert.strictEqual(LIFECYCLE.mount.mock.callCount(), 2)
        assert.strictEqual(LIFECYCLE.unmount.mock.callCount(), 0)
        assert.strictEqual(LIFECYCLE.dispose.mock.callCount(), 0)

        placeholder.unmount?.()
        assert.strictEqual(LIFECYCLE.mount.mock.callCount(), 2)
        assert.strictEqual(LIFECYCLE.unmount.mock.callCount(), 2)
        assert.strictEqual(LIFECYCLE.dispose.mock.callCount(), 0)

        placeholder.dispose?.()
        assert.strictEqual(LIFECYCLE.mount.mock.callCount(), 2)
        assert.strictEqual(LIFECYCLE.unmount.mock.callCount(), 2)
        assert.strictEqual(LIFECYCLE.dispose.mock.callCount(), 2)
      })

      test("should call handlers in order on parent placeholder's handlers", () => {
        let childPlaceholder: Placeholder | undefined

        const parentPlaceholder = createRootPlaceholderAt(
          PARENT_PLACE,
          (renderer) => {
            childPlaceholder = renderer.insertPlaceholder((renderer) => {
              renderer.registerLifecycle(LIFECYCLE)
            })
            return childPlaceholder
          },
        )

        assert.strictEqual(LIFECYCLE.mount.mock.callCount(), 0)
        assert.strictEqual(LIFECYCLE.unmount.mock.callCount(), 0)
        assert.strictEqual(LIFECYCLE.dispose.mock.callCount(), 0)

        parentPlaceholder.mount?.()
        assert.strictEqual(LIFECYCLE.mount.mock.callCount(), 1)
        assert.strictEqual(LIFECYCLE.unmount.mock.callCount(), 0)
        assert.strictEqual(LIFECYCLE.dispose.mock.callCount(), 0)

        parentPlaceholder.unmount?.()
        assert.strictEqual(LIFECYCLE.mount.mock.callCount(), 1)
        assert.strictEqual(LIFECYCLE.unmount.mock.callCount(), 1)
        assert.strictEqual(LIFECYCLE.dispose.mock.callCount(), 0)

        parentPlaceholder.dispose?.()
        assert.strictEqual(LIFECYCLE.mount.mock.callCount(), 1)
        assert.strictEqual(LIFECYCLE.unmount.mock.callCount(), 1)
        assert.strictEqual(LIFECYCLE.dispose.mock.callCount(), 1)
      })
    })

    describe("Lifecycle on replacing content", () => {
      test("should call unmount and dispose for old content", () => {
        const placeholder = createRootPlaceholderAt(
          PARENT_PLACE,
          (renderer) => {
            renderer.registerLifecycle(LIFECYCLE)
          },
        )

        placeholder.mount?.()
        assert.strictEqual(LIFECYCLE.mount.mock.callCount(), 1)

        placeholder.replaceContent(null)

        assert.strictEqual(LIFECYCLE.unmount.mock.callCount(), 1)
        assert.strictEqual(LIFECYCLE.dispose.mock.callCount(), 1)

        // TODO: Check for invocationCallOrder
        // assert(LIFECYCLE.dispose.mock.invocationCallOrder[0]).toBeGreaterThan(
        //   LIFECYCLE.unmount.mock.invocationCallOrder[0],
        // )
      })

      test("should call mount for new content", () => {
        const placeholder = createRootPlaceholderAt(PARENT_PLACE, null)

        placeholder.mount?.()

        placeholder.replaceContent((renderer) => {
          renderer.registerLifecycle(LIFECYCLE)
        })

        assert.strictEqual(LIFECYCLE.mount.mock.callCount(), 1)
        assert.strictEqual(LIFECYCLE.unmount.mock.callCount(), 0)
        assert.strictEqual(LIFECYCLE.dispose.mock.callCount(), 0)
      })

      test("should call unmount and dispose for old content and mount for new content", () => {
        const oldLifecycle = LIFECYCLE

        const newLifecycle = {
          mount: mock.fn(),
          unmount: mock.fn(),
          dispose: mock.fn(),
        }

        const placeholder = createRootPlaceholderAt(
          PARENT_PLACE,
          (renderer) => {
            renderer.registerLifecycle(oldLifecycle)
          },
        )

        placeholder.mount?.()

        placeholder.replaceContent((renderer) => {
          renderer.registerLifecycle(newLifecycle)
        })

        assert.strictEqual(oldLifecycle.unmount.mock.callCount(), 1)
        assert.strictEqual(oldLifecycle.dispose.mock.callCount(), 1)

        assert.strictEqual(newLifecycle.mount.mock.callCount(), 1)

        // TODO: Check for invocationCallOrder
        // assert(
        //   newLifecycle.mount.mock.invocationCallOrder >
        //     oldLifecycle.unmount.mock.invocationCallOrder,
        // )
        // assert(
        //   newLifecycle.mount.mock.invocationCallOrder >
        //     oldLifecycle.dispose.mock.invocationCallOrder,
        // )
      })

      test("for child placeholder should call unmount and dispose for old content and mount for new content", () => {
        const oldLifecycle = LIFECYCLE

        const newLifecycle = {
          mount: mock.fn(),
          unmount: mock.fn(),
          dispose: mock.fn(),
        }

        const placeholder = createRootPlaceholderAt(
          PARENT_PLACE,
          (renderer) => {
            const placeholder = renderer.insertPlaceholder((renderer) => {
              renderer.registerLifecycle(oldLifecycle)
            })
            return placeholder
          },
        )

        placeholder.mount?.()

        placeholder.replaceContent((renderer) => {
          renderer.registerLifecycle(newLifecycle)
        })

        assert.strictEqual(oldLifecycle.unmount.mock.callCount(), 1)
        assert.strictEqual(oldLifecycle.dispose.mock.callCount(), 1)

        assert.strictEqual(newLifecycle.mount.mock.callCount(), 1)

        // TODO: Check for invocationCallOrder
        // assert(
        //   newLifecycle.mount.mock.invocationCallOrder >
        //     oldLifecycle.unmount.mock.invocationCallOrder,
        // )
        // assert(
        //   newLifecycle.mount.mock.invocationCallOrder >
        //     oldLifecycle.dispose.mock.invocationCallOrder,
        // )
      })
    })
  })
})
