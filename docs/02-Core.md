
# RWRTW core

## Live DOM and Dangling DOM

Web-interface are just rendered HTML-documents with styles and JavaScript. Complex UI could be built with DOM API and components approach. There are common practices to break UI structure, appearance and logic into small reusable components. But these practices are not natively supported in web-standards for browser APIs. So JavaScript is still needed.

*DOM* is a representation of an HTML-document describing structure and logic of GUI elements in browser tab. Browser renders one *Live DOM* for every tab. JavaScript code can create many *Dangling DOM* nodes for inserting into the Live DOM later. The Live DOM is a kind of config of what the browser should show on a display. Live DOM describes desirable state of GUI at one moment.

*Web engine* is a browser's internal software component responsible to show and handle user interactions according to current state of the Live DOM in a tab. An application inserts and changes fragments of Live DOM. JavaScript code can:

* create Dangling DOM fragments and insert them into Life DOM,
* remove some DOM-nodes from Live DOM,
* change attributes of DOM-nodes,
* add or remove event listeners.

This Live DOM manipulation logic can be broken into composable parts - components.

## Components

In RWRTW, **Component** is a bunch of three independent layers with different responsibilities:

* **Factory function** - a JavaScript function that
  * builds content of the component's instances (a fragment of Dangling DOM),
  * applies dynamic styles, binds event handlers to DOM nodes,
  * create one ore more controllers,
  * binds the created controllers with the Dangling DOM nodes,
  * registers the controllers in lifecycle of the component;
* **Controller** - a stateful object with arbitrary JavaScript logic, it encapsulates view-state and behavior of the component, makes rendered DOM fragment alive;
* **View state** - a mutable state of component's controller, it can be changed via controller's public interface.

Instantiating component is just calling its factory function with special arguments. The first argument determines the place in DOM tree where the component should insert its content. The second argument is a context of component rendering that represents lifecycle hooks.

A component can instantiate child components by just calling its factory functions with the right arguments.

A component can be empty or create only controllers without DOM nodes. A Component may have logic of conditional rendering of its content. The content may be changed on some events later. A component's controller could insert DOM-nodes in some place or completely remove content.

A component can create its own Dangling DOM fragment and insert it in the Dangling DOM nodes of parent component. The *Root component* inserts the root Dangling DOM containing all rendered fragments of all child components into the Live DOM. Also, the root component is responsible to remove the inserted DOM-fragment from Live DOM if needed.

Every controller has *Lifecycle* with these phases (hooks):

* render - instantiating of controller objects in the component's render function
* mount - additional initialization actions after inserting the Dangling DOM into Live DOM
* unmount - cancellation of mount actions just before the moment of removing the DOM fragment from Live DOM
* dispose - final cleanup actions after which the controller object is not usable any more

Controller can pass render and dispose phases only once but it can be mounted again after unmount. The goal of separate stage of mounting is caching or reusing components' DOM fragments with pre-initialized and bound controllers.

*Component tree* is a tree of component instances (controllers) built along with DOM tree during rendering phase. A component can implement logic for conditional rendering of fragments of such Component trees. So the component is responsible to handle lifecycle of child controllers.

## Place

There is a problem of rendering conditional DOM content and dynamic lists. A component cannot simply create its content and return it from its factory function. If a component returns empty content after its instantiation and wishes to insert DOM nodes later, so how could it know where the nodes should be inserted? What if two or more components with conditional rendering should be rendered one after another? Imagine how it could be implemented in case of component nesting.

DOM API only allows to insert or remove DOM nodes relative to some neighbor nodes or a parent node. So, a controller of a component should remember where it is responsible to insert or remove its DOM content. Also, a component should know whether the adjacent nodes are managed by other controllers.

The idea is that a component should know and remember the place in which it is allowed to insert or remove DOM nodes. Every component builds some Dangling DOM fragment that is to be inserted into some place inside other DOM fragment or Live DOM of the current document.

There are three ways of implementing this with DOM API:

1. Always use some HTMLElement as wrapper for component's content like Custom Elements do.
2. Use utility nodes between dynamic fragments (empty text blocks, special comment nodes) and bind controllers to them.
3. Introduce new kind of objects outside of DOM to uniquely determine where a controller is allowed to do DOM manipulations relative to other controllers or DOM nodes.

The first approach has a problem with CSS box model. We don't want wrap every conditional content into some box. It has overhead and make influence on CSS layout. The second approach has its own risks and has overhead too. We just want something like a preprocessor of Live DOM. There should not be any libraries' artifacts in Live DOM like if Live DOM would just be rendered from simple static HTML. RWRTW implements the third way. So, let's introduce two new slecial kind of objects for manipulation of DOM structure.

*Place* is a reference to some space between adjacent nodes in a component tree. It may be DOM-nodes or special controllers (placeholders). When a component factory is called, it accepts a place object where the component is allowed to insert its DOM nodes. Controllers of the component can remember some places and use them later for DOM manipulations.

There are four cases of place:

* after DOM Node
* inside HTMLElement before first child
* after dynamic content
* inside a dynamic content at the beginning

Controllers with dynamic content should implement replacement operation of dynamic content as a whole. If there are some child controllers the parent controller must call its lifecycle hooks. This part of functionality is very common and can be implemented in a library. It is called Placeholder.

## Placeholder

To remove chain of nodes from DOM we need the place where it starts and the place where it ends. After the removing we need to remember the place where we can insert nodes again. This is the idea of *Placeholder* - a special object to handle manipulations with DOM nodes structure at one point in DOM tree.

*Content* of placeholder is zero or many DOM nodes and other placeholders. Placeholders inside content of a placeholder is *Child placeholders*. Child placeholders could be inside child Elements of content. *Placeholder tree* is a tree of placeholders bound to DOM tree.

Placeholder is allowed to do only primitive DOM operations at one place. Complex DOM transformations and restructuring are possible by composing of many placeholders. But every placeholder is restricted to do only the following operations with its content as a whole:

* Placeholder can **insert** some content in one step,
* Placeholder can **remove** its content in one step,
* Placeholder can **replace** all its content with new content in one step.
  
There is no ability to edit content nodes using the placeholder. We cannot append, insert or remove nodes inside the content with the placeholder. We can use DOM API directly for this but not a placeholder.

Placeholders could follow each others in chain. Every placeholder must remember its place where it was created. After a placeholder is created it cannot modify its place or move to an other place. The only exception is when placeholder is used as an item of a dynamic list.

So, we can now define Place more accurately. Place is a reference to DOM node or placeholder in combination with "after" or "inside" sign. Again, there are four cases of place:

* **after** DOM Node
* **inside** HTMLElement before first child
* **after** a Placeholder
* **inside** a Placeholder at the beginning

The first two are called *DOM-places*. The last two are called *Placeholder-places*.

Place is implemented as simple reference to Node or Placeholder object or as a wrapper of parent Node or parent Placeholder object. Direct reference to Node or Placeholder means the place is after the object it points to. Wrapper object means that the place is inside a Node or a Placeholder at the beginning.

To insert DOM nodes into DOM tree of document or fragment we need to calculate DOM-place of Placeholder-places. Every Placeholder-place can be calculated to corresponding DOM-place with the algorithm:

* If a place is a Placeholder:
  * If the last node in content of the placeholder is a DOM Node - this node is the DOM-place after the placeholder
  * If the last node in content of the placeholder is a child Placeholder - the DOM-place after the placeholder is the DOM-place after the child Placeholder (recursively)
  * If the content of the Placeholder is empty - the DOM-place after the placeholder is the DOM-place of the place where this placeholder was created. It could be other Placeholder or parent Placeholder, so we need to calculate recursively.
* If a place is at the beginning of a parent Placeholder - the resulting DOM-place is the DOM-place of a place where the parent Placeholder was created (recursively).

This algorithm targets to chain of placeholders with nested placeholders at start or end of parent placeholders. If a Placeholder is surrounded with regular DOM Nodes and contains "static" DOM Nodes the bounds of its content in DOM tree is clear.

## Dynamic list

When we need to represent dynamic collection of items in DOM, we would need a collection of placeholders. *Dynamic list* is an ordered collection of placeholders. Every placeholder in dynamic list is created at place after previous placeholder. The first placeholder in a list is created at place of the list was created. Dynamic list behaves as placeholder in calculation of DOM-places. So, dynamic list can be used everywhere placeholder can but it has different set of operations.

Dynamic list manages child placeholder as an indexed array. The possible operations are these:

* **insert** some content at index to create item (child placeholder),
* **remove** an item at index,
* **replace** content of an item at index,
* **move** item from index to other index (with shifting the middle items),
* **swap** two items,
* **clear** entire list.

When dynamic list performs the operations, it maintains places of the placeholders so they are organized in linked list.

Dynamic list can be used to represent dynamic collection with unknown size. Items can have different content. But it is practically convenient to create items of one dynamic list with one template component. So, dynamic list can be used to implement something like `for`-loop in markup. Items template can have arguments to accept corresponding data items. When data collection in view state is changed, the dynamic list inserts, updates, moves and removes corresponding items to actualize the view according to the view state.
