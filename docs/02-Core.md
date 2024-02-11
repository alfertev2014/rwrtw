
# RWRTW core

## Components

User interfaces are rendered HTML-documents with styles and JavaScript. Complex UI could be built with DOM API and components approach. There are common practices to break UI structure, appearance and logic into small reusable components.

*DOM* is a representation of HTML-document describing structure and logic of GUI elements in browser tab. Browser tab renders one *Live DOM* but JavaScript code can create many *Dangling DOM* fragments for inserting into Live DOM later. Live DOM is like a config of what browser should show on display. Live DOM describes desirable state of GUI at one moment. *Web engine* is a browser internal software component responsible to show and handle user interactions according to current state of Live DOM. Application inserts and changes fragments of Live DOM. JavaScript code can create Dangling DOM fragments and insert it into Life DOM, remove some DOM nodes from Live DOM, change attributes of nodes, add or remove event listeners. This logic of Live DOM manipulation breaks into composable parts - components.

**Component** is a bunch of three independent layers with different responsibilities:

* **Factory function** is a JavaScript function that
  * builds content of the component's instances (Dangling DOM fragment),
  * applies dynamic styles, binds event handlers,
  * create one ore more controller objects,
  * binds the created controllers with the Dangling DOM fragment,
  * registers the controllers in lifecycle.
* **Controller** is a stateful object that encapsulates view-state and behavior of the component, makes rendered DOM fragment alive
* **View state** is a mutable state of component's controller, it can be changed via controller's interface or by handling DOM events

Instantiating component is just calling its factory function with special arguments. The first argument determines the place in DOM-tree where the component should insert its content. The second argument is a context of component rendering representing lifecycle.

Component can instantiate child components by just calling its factory functions with the right arguments.

Component can be empty and create only controllers which will be not bound to any DOM nodes. Component may have logic of conditional rendering of its DOM-content. The content may change on some events. A component's controller could insert DOM-nodes in some place or completely remove content.

Component can create its own Dangling DOM fragment and insert it in Dangling DOM of parent component. There will be some *Root component* which insert the root Dangling DOM containing all rendered fragments of all child components into Live DOM. Also, the root component is responsible to remove the inserted DOM-fragment from Live DOM if needed.

Every controller has *Lifecycle* with phases (hooks):

* render - instantiating of controller objects in the component's render function
* mount - additional initialization actions after inserting the Dangling DOM into Live DOM
* unmount - cancellation of mount actions just before the moment of removing the DOM fragment from Live DOM
* dispose - final cleanup actions after which the controller object is not usable any more

Controller can pass render and dispose phases only once but it can be mounted again after unmount. The goal of separate stage of mounting is caching or reusing components' DOM fragments with pre-initialized and bound controllers.

*Component tree* is a tree of component instances (controllers) built along with DOM tree during rendering phase. A component can implement logic for conditional rendering of fragments of such Component trees. So the component is responsible to handle lifecycle of child controllers.

## Place

There is a problem of rendering conditional DOM content and dynamic lists. Component cannot simply create its content and return it from its factory function. If component returns empty content after instantiation and wish to insert DOM nodes later, so how it could know where the nodes should be inserted? What if two or more components with conditional rendering should be rendered one after another? Imagine how it could be implemented in case of nesting such components.

DOM API allows inserting or removing DOM nodes only relative to some neighbor nodes or a parent node. So, a controller should remember where it is responsible to insert or remove its DOM-tree fragment. Also, a component should know whether the adjacent nodes are managed by other controllers.

The idea is that component should know and remember the place in which it is allowed to insert or remove DOM nodes. Every component describes some Dangling DOM fragment that is to be inserted into some place inside other DOM fragment or Live DOM of current document.

There are three ways of implementing this in DOM:

1. Always use some HTMLElement as wrapper for component's content like Custom Elements do
2. Use utility nodes between conditional fragments (empty text blocks, special comment nodes) and bind controllers to them
3. Introduce new entity in JavaScript world to uniquely determine where a controller is allowed to do DOM manipulations relative to other controllers or DOM nodes

The first approach has a problem with CSS box model. We don't want wrap every conditional branch into some box. It has overhead and interferes with CSS layout. The second approach has its own risks and also has overhead. We just want something like preprocessor of Live DOM. There should not be any libraries' artifacts in Live DOM like if Live DOM would just be rendered from simple static HTML. So, RWRTW implements the third way.

*Place* is a reference to some space between adjacent nodes in a component tree. It may be DOM-nodes or special controllers (placeholders). When a component factory is called, it accepts a place object where the component is allowed to insert its DOM nodes. Controllers of component can remember some places and use them later for DOM manipulation.

There are four cases of place:

* after DOM Node
* inside HTMLElement before first child
* after dynamic content
* inside a dynamic content at the beginning

Controllers with dynamic content should implement replacement operation of dynamic content entirely. If there are some child controllers the parent controller must call its lifecycle hooks. This part of functionality is very common and can be implemented in library. It is called Placeholder.

## Placeholder

To remove chain of nodes from DOM we need a place where it starts and place where it ends. After removing we need to remember the place where we can insert nodes again. This is the idea of *Placeholder* - special object type to handle manipulations with DOM node structure.

*Content* of placeholder is zero or many DOM nodes and other placeholders. Placeholders inside content of a placeholder is *Child placeholders*. Child placeholders could be inside child Elements of content. *Placeholder tree* is a tree of placeholders bound to DOM tree.

Placeholder is allowed to do only primitive DOM operations. Complex DOM transformations and restructuring are possible by composing many placeholders but every placeholder is restricted to do only this operations with its content as a whole:

* Placeholder can *insert* some content in one step.
* Placeholder can *remove* its content also in one step,
* Placeholder can *replace* all its content with new content in one step.
  
There is no ability to edit content using the placeholder. We cannot append, insert or remove nodes inside the content with the placeholder. We could use DOM API directly for this but not placeholder.

Placeholders could follow each others in chain. Every placeholder must remember its place where it was created. When placeholder created it cannot modify its place or move to other place. Exception is when placeholder is used as an item of dynamic list.

So, we can now define Place more accurately. Place is a reference to DOM node or placeholder in combination with "after" or "inside" sign. There are four cases of place:

* after DOM Node
* inside HTMLElement before first child
* after a Placeholder
* inside a Placeholder at the beginning

The first two are called DOM-places. The last two are called Placeholder-places.

Place is implemented as simple reference to Node or Placeholder object or as a wrapper of Node or Placeholder object. Direct reference to Node or Placeholder means the place is after the object it points to. Wrapper object means sign than the place is inside a Node or a Placeholder at the beginning.

To insert DOM nodes into DOM tree of document or fragment we need to calculate DOM-place of Placeholder-places. Every Placeholder-place can be calculated to corresponding DOM place with the algorithm:

* If a place is a Placeholder:
  * If the last node in content of the placeholder is a DOM Node - this node is the DOM-place after the placeholder
  * If the last node in content of the placeholder is a child Placeholder - the DOM-place after the placeholder is the DOM-place after the child Placeholder (recursively).
  * If the content of the Placeholder is empty - the DOM-place after the placeholder is the DOM-place of the place where this placeholder was created. It could be other Placeholder or parent Placeholder.
* If a place is at the beginning of a parent Placeholder - the resulting DOM-place is the DOM-place of a place where the parent Placeholder was created (recursively).

This algorithm targets to chain of placeholder with nested placeholders at start or end of parent placeholders. If a Placeholder is surrounded with regular DOM Nodes and contains "static" DOM Nodes the bounds of its content in DOM tree is clear.