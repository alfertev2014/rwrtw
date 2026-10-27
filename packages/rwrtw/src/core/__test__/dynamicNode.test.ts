import assert from "node:assert"
import test, { beforeEach, describe, mock, type Mock } from "node:test"
import {
  type DynamicNode,
  createRootDynamicNodeAt,
  placeAtBeginningOf,
  type DOMPlace,
} from "../index.js"

describe("DynamicNode", () => {
  let PARENT_NODE: HTMLElement
  let PARENT_PLACE: DOMPlace

  beforeEach(() => {
    PARENT_NODE = document.createElement("div")
    PARENT_PLACE = placeAtBeginningOf(PARENT_NODE)
  })

  describe("Create root dynamicNode inside regular DOM Node", () => {
    test("with empty content - should do nothing with DOM", () => {
      const dynamicNode = createRootDynamicNodeAt(PARENT_PLACE, null)

      assert.strictEqual(dynamicNode.lastDOMPlace(), PARENT_PLACE)
      assert.strictEqual(PARENT_NODE.childNodes.length, 0)
    })

    test("with one child Node - should insert this node at place", () => {
      const innerNode = document.createElement("div")

      const dynamicNode = createRootDynamicNodeAt(PARENT_PLACE, (renderer) =>
        renderer.insertNode(innerNode),
      )

      assert.strictEqual(dynamicNode.lastDOMPlace(), innerNode)
      assert.strictEqual(innerNode.parentNode, PARENT_NODE)
      assert.strictEqual(PARENT_NODE.firstChild, innerNode)
    })

    test("with several Nodes in content - should insert it in DOM", () => {
      let node: Node = document.createElement("div")
      const firstNode = node

      const NODES_COUNT = 10

      const dynamicNode = createRootDynamicNodeAt(PARENT_PLACE, (renderer) => {
        renderer.insertNode(node)
        for (let i = 1; i < NODES_COUNT; ++i) {
          node = renderer.insertNode(document.createTextNode("some text"))
        }
      })

      assert.strictEqual(dynamicNode.lastDOMPlace(), node)
      assert.strictEqual(firstNode.parentNode, PARENT_NODE)
      assert.strictEqual(node.parentNode, PARENT_NODE)
      assert.strictEqual(PARENT_NODE.firstChild, firstNode)
      assert.strictEqual(PARENT_NODE.childNodes.length, NODES_COUNT)
    })
  })

  describe("Create child dynamicNode", () => {
    test("at start of dynamicNode - should be at starting place", () => {
      let childDynamicNode: DynamicNode | undefined

      createRootDynamicNodeAt(PARENT_PLACE, (renderer) => {
        childDynamicNode = renderer.insertDynamicNode(null)
      })

      assert.strictEqual(childDynamicNode?.lastDOMPlace(), PARENT_PLACE)
      assert.strictEqual(PARENT_NODE.childNodes.length, 0)
    })

    test("with content - should insert the content into parent", () => {
      let childDynamicNode: DynamicNode | undefined
      let innerNode: Node | undefined

      const parentDynamicNode = createRootDynamicNodeAt(
        PARENT_PLACE,
        (renderer) => {
          childDynamicNode = renderer.insertDynamicNode((renderer) => {
            innerNode = renderer.insertNode(document.createElement("div"))
          })
        },
      )

      assert.strictEqual(childDynamicNode?.lastDOMPlace(), innerNode)
      assert.strictEqual(parentDynamicNode.lastDOMPlace(), innerNode)
      assert.strictEqual(PARENT_NODE.childNodes.length, 1)
      assert.strictEqual(PARENT_NODE.firstChild, innerNode)
    })

    test("with two child dynamicNodes - should insert the content of both into parent", () => {
      let childDynamicNode1: DynamicNode | undefined
      let childDynamicNode2: DynamicNode | undefined
      let innerNode1: Node | undefined
      let innerNode2: Node | undefined

      const parentDynamicNode = createRootDynamicNodeAt(
        PARENT_PLACE,
        (renderer) => {
          childDynamicNode1 = renderer.insertDynamicNode((renderer) => {
            innerNode1 = renderer.insertNode(document.createElement("div"))
          })
          childDynamicNode2 = renderer.insertDynamicNode((renderer) => {
            innerNode2 = renderer.insertNode(document.createElement("div"))
          })
        },
      )

      assert.strictEqual(PARENT_NODE.childNodes.length, 2)
      assert.strictEqual(PARENT_NODE.firstChild, innerNode1)
      assert.strictEqual(PARENT_NODE.lastChild, innerNode2)
      assert.strictEqual(childDynamicNode1?.lastDOMPlace(), innerNode1)
      assert.strictEqual(childDynamicNode2?.lastDOMPlace(), innerNode2)

      assert.strictEqual(parentDynamicNode.lastDOMPlace(), innerNode2)
    })
  })

  describe("Replace dynamicNode content", () => {
    test("instead of empty - should insert new content and correct lastDOMPlace of parent dynamicNode", () => {
      let childDynamicNode: DynamicNode | undefined
      let innerNode: Node | undefined

      const parentDynamicNode = createRootDynamicNodeAt(
        PARENT_PLACE,
        (renderer) => {
          childDynamicNode = renderer.insertDynamicNode(null)
        },
      )

      childDynamicNode?.replaceContent((renderer) => {
        innerNode = renderer.insertNode(document.createElement("div"))
      })

      assert.strictEqual(PARENT_NODE.childNodes.length, 1)
      assert.strictEqual(PARENT_NODE.firstChild, innerNode)

      assert.strictEqual(childDynamicNode?.lastDOMPlace(), innerNode)
      assert.strictEqual(parentDynamicNode.lastDOMPlace(), innerNode)
    })

    test("instead of nodes - should insert new content and correct lastDOMPlace of parent dynamicNode", () => {
      let childDynamicNode: DynamicNode | undefined
      let innerNode: Node | undefined

      const parentDynamicNode = createRootDynamicNodeAt(
        PARENT_PLACE,
        (renderer) => {
          childDynamicNode = renderer.insertDynamicNode((renderer) => {
            renderer.insertNode(document.createElement("div"))
          })
        },
      )

      childDynamicNode?.replaceContent((renderer) => {
        innerNode = renderer.insertNode(document.createElement("div"))
      })

      assert.strictEqual(PARENT_NODE.childNodes.length, 1)
      assert.strictEqual(PARENT_NODE.firstChild, innerNode)

      assert.strictEqual(childDynamicNode?.lastDOMPlace(), innerNode)
      assert.strictEqual(parentDynamicNode.lastDOMPlace(), innerNode)
    })

    test("empty content instead of nodes - should remove old content and correct lastDOMPlace of parent dynamicNode", () => {
      let childDynamicNode: DynamicNode | undefined

      const parentDynamicNode = createRootDynamicNodeAt(
        PARENT_PLACE,
        (renderer) => {
          childDynamicNode = renderer.insertDynamicNode((renderer) => {
            renderer.insertNode(document.createElement("div"))
          })
        },
      )

      childDynamicNode?.replaceContent(null)

      assert.strictEqual(PARENT_NODE.firstChild, null)

      assert.strictEqual(childDynamicNode?.lastDOMPlace(), PARENT_PLACE)
      assert.strictEqual(parentDynamicNode.lastDOMPlace(), PARENT_PLACE)
    })

    test("removing content of last child dynamicNode - should correct parent lastDOMPlace to first child dynamicNode", () => {
      let childDynamicNode1: DynamicNode | undefined
      let childDynamicNode2: DynamicNode | undefined
      let innerNode1: Node | undefined

      const parentDynamicNode = createRootDynamicNodeAt(
        PARENT_PLACE,
        (renderer) => {
          childDynamicNode1 = renderer.insertDynamicNode((renderer) => {
            innerNode1 = renderer.insertNode(document.createElement("div"))
          })
          childDynamicNode2 = renderer.insertDynamicNode((renderer) => {
            renderer.insertNode(document.createElement("div"))
          })
        },
      )

      childDynamicNode2?.replaceContent(null)

      assert.strictEqual(PARENT_NODE.childNodes.length, 1)
      assert.strictEqual(PARENT_NODE.firstChild, innerNode1)
      assert.strictEqual(innerNode1?.nextSibling, null)
      assert.strictEqual(childDynamicNode1?.lastDOMPlace(), innerNode1)
      assert.strictEqual(childDynamicNode2?.lastDOMPlace(), innerNode1)

      assert.strictEqual(parentDynamicNode.lastDOMPlace(), innerNode1)
    })

    test("removing content of first child dynamicNode - should correct second's lastDOMPlace to parent place", () => {
      let childDynamicNode1: DynamicNode | undefined
      let childDynamicNode2: DynamicNode | undefined
      let innerNode2: Node | undefined

      const parentDynamicNode = createRootDynamicNodeAt(
        PARENT_PLACE,
        (renderer) => {
          childDynamicNode1 = renderer.insertDynamicNode((renderer) => {
            renderer.insertNode(document.createElement("div"))
          })
          childDynamicNode2 = renderer.insertDynamicNode((renderer) => {
            innerNode2 = renderer.insertNode(document.createElement("div"))
          })
        },
      )

      childDynamicNode1?.replaceContent(null)

      assert.strictEqual(PARENT_NODE.childNodes.length, 1)
      assert.strictEqual(PARENT_NODE.firstChild, innerNode2)
      assert.strictEqual(childDynamicNode1?.lastDOMPlace(), PARENT_PLACE)
      assert.strictEqual(childDynamicNode2?.lastDOMPlace(), innerNode2)

      assert.strictEqual(parentDynamicNode.lastDOMPlace(), innerNode2)
    })
  })

  describe("Lifecycles", () => {
    let LIFECYCLE: {
      mount: Mock<VoidFunction>
      unmount: Mock<VoidFunction>
    }

    beforeEach(() => {
      LIFECYCLE = {
        mount: mock.fn<VoidFunction>(),
        unmount: mock.fn<VoidFunction>(),
      }
    })

    describe("Registration of one lifecycle", () => {
      test("should call handlers in order on dynamicNode's handler", () => {
        const dynamicNode = createRootDynamicNodeAt(
          PARENT_PLACE,
          (renderer) => {
            renderer.registerLifecycle(LIFECYCLE)
          },
        )

        assert.strictEqual(LIFECYCLE.mount.mock.callCount(), 0)
        assert.strictEqual(LIFECYCLE.unmount.mock.callCount(), 0)

        dynamicNode.mount?.()
        assert.strictEqual(LIFECYCLE.mount.mock.callCount(), 1)
        assert.strictEqual(LIFECYCLE.unmount.mock.callCount(), 0)

        dynamicNode.unmount?.()
        assert.strictEqual(LIFECYCLE.mount.mock.callCount(), 1)
        assert.strictEqual(LIFECYCLE.unmount.mock.callCount(), 1)
      })

      test("double registration should call handlers twice in order on dynamicNode's handler", () => {
        const dynamicNode = createRootDynamicNodeAt(
          PARENT_PLACE,
          (renderer) => {
            renderer.registerLifecycle(LIFECYCLE)
            renderer.registerLifecycle(LIFECYCLE)
          },
        )

        assert.strictEqual(LIFECYCLE.mount.mock.callCount(), 0)
        assert.strictEqual(LIFECYCLE.unmount.mock.callCount(), 0)

        dynamicNode.mount?.()
        assert.strictEqual(LIFECYCLE.mount.mock.callCount(), 2)
        assert.strictEqual(LIFECYCLE.unmount.mock.callCount(), 0)

        dynamicNode.unmount?.()
        assert.strictEqual(LIFECYCLE.mount.mock.callCount(), 2)
        assert.strictEqual(LIFECYCLE.unmount.mock.callCount(), 2)
      })

      test("should call handlers in order on parent dynamicNode's handlers", () => {
        let childDynamicNode: DynamicNode | undefined

        const parentDynamicNode = createRootDynamicNodeAt(
          PARENT_PLACE,
          (renderer) => {
            childDynamicNode = renderer.insertDynamicNode((renderer) => {
              renderer.registerLifecycle(LIFECYCLE)
            })
            return childDynamicNode
          },
        )

        assert.strictEqual(LIFECYCLE.mount.mock.callCount(), 0)
        assert.strictEqual(LIFECYCLE.unmount.mock.callCount(), 0)

        parentDynamicNode.mount?.()
        assert.strictEqual(LIFECYCLE.mount.mock.callCount(), 1)
        assert.strictEqual(LIFECYCLE.unmount.mock.callCount(), 0)

        parentDynamicNode.unmount?.()
        assert.strictEqual(LIFECYCLE.mount.mock.callCount(), 1)
        assert.strictEqual(LIFECYCLE.unmount.mock.callCount(), 1)
      })
    })

    describe("Lifecycle on replacing content", () => {
      test("should call unmount for old content", () => {
        const dynamicNode = createRootDynamicNodeAt(
          PARENT_PLACE,
          (renderer) => {
            renderer.registerLifecycle(LIFECYCLE)
          },
        )

        dynamicNode.mount?.()
        assert.strictEqual(LIFECYCLE.mount.mock.callCount(), 1)

        dynamicNode.replaceContent(null)

        assert.strictEqual(LIFECYCLE.unmount.mock.callCount(), 1)
      })

      test("should call mount for new content", () => {
        const dynamicNode = createRootDynamicNodeAt(PARENT_PLACE, null)

        dynamicNode.mount?.()

        dynamicNode.replaceContent((renderer) => {
          renderer.registerLifecycle(LIFECYCLE)
        })

        assert.strictEqual(LIFECYCLE.mount.mock.callCount(), 1)
        assert.strictEqual(LIFECYCLE.unmount.mock.callCount(), 0)
      })

      test("should call unmount for old content and mount for new content", () => {
        const oldLifecycle = LIFECYCLE

        const newLifecycle = {
          mount: mock.fn(),
          unmount: mock.fn(),
        }

        const dynamicNode = createRootDynamicNodeAt(
          PARENT_PLACE,
          (renderer) => {
            renderer.registerLifecycle(oldLifecycle)
          },
        )

        dynamicNode.mount?.()

        dynamicNode.replaceContent((renderer) => {
          renderer.registerLifecycle(newLifecycle)
        })

        assert.strictEqual(oldLifecycle.unmount.mock.callCount(), 1)

        assert.strictEqual(newLifecycle.mount.mock.callCount(), 1)

        // TODO: Check for invocationCallOrder
        // assert(
        //   newLifecycle.mount.mock.invocationCallOrder >
        //     oldLifecycle.unmount.mock.invocationCallOrder,
        // )
      })

      test("for child dynamicNode should call unmount for old content and mount for new content", () => {
        const oldLifecycle = LIFECYCLE

        const newLifecycle = {
          mount: mock.fn(),
          unmount: mock.fn(),
        }

        const dynamicNode = createRootDynamicNodeAt(
          PARENT_PLACE,
          (renderer) => {
            const dynamicNode = renderer.insertDynamicNode((renderer) => {
              renderer.registerLifecycle(oldLifecycle)
            })
            return dynamicNode
          },
        )

        dynamicNode.mount?.()

        dynamicNode.replaceContent((renderer) => {
          renderer.registerLifecycle(newLifecycle)
        })

        assert.strictEqual(oldLifecycle.unmount.mock.callCount(), 1)

        assert.strictEqual(newLifecycle.mount.mock.callCount(), 1)

        // TODO: Check for invocationCallOrder
        // assert(
        //   newLifecycle.mount.mock.invocationCallOrder >
        //     oldLifecycle.unmount.mock.invocationCallOrder,
        // )
      })
    })
  })
})
