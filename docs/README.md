# RWRTW

RWRTW is a simple library for building UI components with browser's DOM API. It contains tiny DOM helpers and minimal building blocks to structure and manage UI component trees with view state logic and handle its lifecycle.

## Motivation

Existing frameworks are overcomplicated and relatively heavy in comparison with small libraries. These are some of problems:

* Many abstraction layers which is almost always leaky.
* Vender locking. Easy to use solutions from one ecosystem but hard to integrate and compose with others.
* They could solve problems we are not interested for. But we have to pay for it with performance and learning time.
* The solutions of these contrived problems may lead to new problems a framework is responsible to solve.

Building UI using vanilla JS still requires writing boilerplate and is error prone. But modern JavaScript and new browser's APIs allow writing cleaner code without old utility libraries and without redundant abstraction layers such as jQuery.

There are some principles of software development that cannot be enforced using any library or framework in a project. A software developers still responsible to ensure it by themselves. There are always a lot of implicit conventions and assumptions in any code, especially in JavaScript code. No type checking system could express these conventions and assumptions. No static analysis tools could ensure all the conventions and assumptions. So, software developers still have to do this analysis by reading a code. OOP design patterns, SOLID, KISS, YAGNY, Clean Architecture, immutability, reactive programming are examples of such principles. Developer need not use any framework or library to ensure these principles.

## Goals

* An ability to develop UI applications as close to vanilla JS as possible using browser's APIs with only lightweight helper libraries.
* The libraries should bring only necessary abstractions and should not solve or create new contrived problems.
* The libraries are responsible to help in
  * creating UI components by component abstraction,
  * constructing DOM tree fragments and components tree (*view*),
  * binding constructed DOM trees (view) with view state (or *view model*), handling HTML events and forms
* The libraries should be ultimately composable with one another and possibly with other libraries.
* Usage of every library should be optional, every library should be replaceable with analogous solutions.
* Usage of the libraries should not require additional tools (any build tool should be optional)

## Not goals

* Toolkit to solve the whole stack of UI-development problems
* A library for full-fledged reactivity to bind model with view model
* A library for "state management"
* Sticking to one programming paradigm (OOP, FP, sync or async, declarative or imperative programming)
* Creating template languages with special syntax and additional build step
* Special integrations in build process (e.g. webpack loaders or plugins)

## Development principles and restrictions

* Zero runtime dependencies, only vanilla JS and browser's APIs
* Transparent logic for developers who knows HTML, CSS, DOM API, event handling, WebComponents etc.
* Implementation as close to DOM API as possible without tricky abstraction layers
* Minimal size of library is more important than peak performance
* Target modern JavaScript with native ES-modules in browser
* Developer experience in mind
* Actively use TypeScript and assume users of the libraries will also use TypeScript
* TypeScript should be in strict mode with thorough typings, prohibiting "any" and "object" types
* Be minification friendly:
  * Don't use string literals for property names
  * Don't analyze function parameters names
* Be tree-shaking friendly:
  * Fine-grained modularization
  * Don't tangle modules, minimize imports, don't create cyclic dependencies
  * Use statically resolvable exports
  * Don't add redundant dynamic polymorphism
* Try using less memory, don't create intermediate objects, arrays and lambdas without need
* Prohibit any JS prototypes modifications and monkey patching
* Prohibit creating of new properties on DOM Node objects and other built-in types
* Prohibit dangerous "innerHtml" modifications
* Don't create any hidden DOM-nodes for utility purposes such as nodes with "display: none", empty text nodes, comment nodes
* Don't do tricky metaprogramming with properties and parameters:
  * Don't assume naming conventions
  * Don't use computed property names
  * Don't invent any dependency injection
  * Don't use decorators
* Don't require any additional build step for special DSL (even JSX)
* Don't create any inner languages inside string literals:
  * Don't create any conventions about strings content
  * Don't parse any strings even using "split" or analyzing strings content char by char

## Basic ideas

### Components

User interfaces are rendered HTML-documents with styles and JavaScript. Complex UI could be built with DOM API and components approach. There are common practices to break UI structure, appearance and logic into small reusable components.

*DOM* is a representation of HTML-document describing structure and logic of GUI elements in browser tab. Browser tab renders one *Live DOM* but JavaScript code can create many *Dangling DOM*. Live DOM is like a config of what browser should render. It describes desirable state of GUI at one moment. *Web engine* is a browser internal software component responsible to show and handle user interactions according to current state of Live DOM. Application inserts and changes fragments of Live DOM. It can create dangling Dangling DOM fragment and insert it into Life DOM, remove some DOM nodes from Live DOM, change attributes of nodes and add or remove event listeners. This logic of Live DOM manipulation breaks into composable parts - components.

*Component* is a bunch of three independent layers with different responsibilities:

* *Factory function* is a function that
  * builds content of the component's instances (DOM-tree fragment),
  * applies dynamic styles, binds event handlers,
  * create one ore more controller objects,
  * binds the controllers with the DOM-tree fragment,
  * registers the controllers in lifecycle.
* *Controller* is a stateful object that encapsulates view-state and behavior of a component, makes rendered DOM-tree fragment alive
* *View state* is a mutable state of component's controller, it can be changed via controller's interface or by handling DOM events

Instantiating component is just calling its factory function with special arguments. The first argument determines the place in DOM-tree where component should insert its content. The second argument is a context of parent component. Component can instantiate child components by just calling its factory functions with right arguments.

Component can be empty and create only controllers. Component may have logic of conditional rendering of its DOM-content. The content may change on some events. Component's controller could insert DOM-nodes in some place or completely remove content.

Component can create its own Dangling DOM fragment and insert it in Dangling DOM of parent component. There will be some *Root component* which insert the root Dangling DOM containing all rendered fragments of all child components into Live DOM and is responsible to remove the inserted DOM-fragment from Live DOM if needed.

Every controller has *Lifecycle* with phases (hooks):

* render - instantiating of controller object in component's render function
* mount - additional initialization actions after inserting Dangling DOM into Live DOM
* unmount - cancelling of mount actions just before the moment of removing DOM-fragment from Live DOM
* dispose - final cleanup actions after which the controller object is not usable any more

Controller can pass render and dispose phases only once but it can be mounted again after unmount. The goal of separate stage of mounting is caching or reusing components' DOM fragments with pre-initialized and bound controllers.

*Component tree* is a tree of component instances (controllers) built along with DOM tree during rendering phase. A component can implement logic for conditional rendering of fragments of such Component trees. So the component is responsible to handle lifecycle of child controllers.

### Place

There is a problem of rendering conditional DOM content and dynamic lists. Component cannot simply create its content and return it from its factory function. If component returns empty content after instantiation and wish to insert DOM nodes later, so how it could know where the nodes should be inserted? What if two or more components with conditional rendering should be rendered one after another? Imagine how it could be implemented in case of nesting such components.

DOM API allows inserting or removing DOM nodes only relative to some neighbor nodes or a parent node. So, a controller should remember where it is responsible to insert or remove its DOM-tree fragment. Also, a component should know whether the adjacent nodes are managed by other controllers.

The idea is that component should know and remember the place in which it is allowed to insert or remove DOM nodes. Every component describes some Dangling DOM fragment that is to be inserted into some place inside other DOM fragment or Live DOM of current document.

There are three ways of implementing this in DOM:

1. Always use some HTMLElement as wrapper for component's content like Custom Elements do
2. Use utility nodes between conditional fragments (empty text blocks, special comment nodes) and bind controllers to them
3. Introduce new entity to uniquely determine where a controller is allowed to do DOM manipulations relative to other controllers or DOM nodes

The first approach has a problem with CSS box model. We don't want wrap every conditional branch into some box. It has overhead and interferes with CSS layout. The second approach has its own risks and also has overhead. We just want something like preprocessor of Live DOM. There should not be any library artifacts in Live DOM like if Live DOM is just simple static HTML.

*Place* is a reference to some space between adjacent nodes in a component tree. It may be DOM-nodes or special controllers (placeholders). When a component factory is called, it accept a place object where the component inserts DOM nodes. Controllers of component can remember its place use it.

There are four cases of place:

* after DOM Node
* inside HTMLElement before first child
* after dynamic content
* inside a dynamic content at the beginning

Controllers with dynamic content should implement replacement operation of dynamic content entirely. If there are some child controllers parent controller must call its lifecycle hooks. This part of functionality is very common and can be implemented in library.

## Placeholder

To remove chain of nodes from DOM we need starting and ending places.

// TBD

## Road map

* v0.0.x:
  * Understanding basic ideas of component model and helper functions
  * Understanding module structure of the project
  * Draft version of public API of all modules
  * Writing tests for the public API
  * Configuration of devDependencies and publishing
  * Understanding implementation ideas of complex parts: lifecycle, template DSL, reactivity, dynamic lists
* v0.1.0:
  * Final version of public API
  * Tests for all documented use cases of API
  * Documentation of API
  * Example projects with stateful and stateless components, event handling, interactive UI (HTML Forms), conditional rendering and dynamic lists
* v0.2.0:
  * Error handling
  * Benchmarking and ideas for optimizations
  * Examples with 3rd party state management and styling libraries
  * Helpers for WebComponents
* ...
