# RWRTW

RWRTW is a simple MVVM library for building UI components with browser's DOM. It contains tiny DOM helpers and building blocks for MVVM components.

## Goals

* An ability to develop UI applications as close to vanilla JS as possible using browser's APIs with only lightweight helper libraries.
* The libraries should bring only necessary abstractions and sould not solve or create new contrived problems.
* The libraries should be ultimately composable with one another and possibly with other libraries.
* Usage of every library sould be optional, every library should be replacable to analogous solutions.
* Usage of the libraries should not require additional tools (all build tools should be optional)

## Not goals

* Toolkit to solve entire stack of problems in UI-development
* Sticking to one programming paradigm
* DSLs for component templates with special syntax and additional build step
* Special integrations for build process (e.g. webpack loaders or plugins)

## Motivation

Existing frameworks are overcomplicated and relatively heavy in comparison with small libraries. They bring a kind of "vender locking" problem. They could solve problems we are not interested for. The solutions of these contrived problems may lead to new problems a framework is responsible to solve.

Building UI using vanilla JS still requires writing boilerplate and is error prone. But modern JavaScript and new browser's APIs allow writing cleaner code without old utility libraries with redundant abstraction layers such as jQuery.

There are some principles of software development that could not be ensured using any library or framework in a project. A software developers still responsible to ensure it by themselves. There are always a lot of implicit conventions and assumptions in any code, especially in JavaScript code. No type checking system could express these conventions and assumptions. No static analysis tools could ensure all the conventions and assumptions. So, software developers still have to do this analysis by reading a code. OOP design patterns, SOLID, KISS, YAGNY, Clean Architecture, immutability, reactive programming are examples of such principles. So, do we really need heavy frameworks with vender-locked ecosystems not compatible with one another?

## Development principles and restrictions

* Zero runtime dependencies, only vanilla JS and browser's APIs
* Prohibit any JS prototypes modifications and monkey patching
* Prohibit creating of new properties on DOM Node objects and other built-in types
* Prohibit dangerous "innerHtml" modifications
* Don't require any additional build step for special DSL (even JSX)
* Don't parse any strings even using "split" or analysing strings content by characters, don't create any conventions about strings content
* Be minification friendly: Don't use strings for property names, don't analyse function parameters names, don't do triky metaprogramming with properties and parameters, don't assume naming conventions
* TypeScript support in strict mode with thorough typings, prohibiting "any" and "object" types
* Don't use TypeScript-specific features in source code (namespaces, "private" fields) except "readonly"
* Use less memory, don't create intermediate objects, arrays and lambdas without need
* Don't insert DOM nodes into live document tree one by one, don't trigger layouting process so often
* Modularization for fine-graned dependency control, pluggable extentions, be tree-shaking friendly
* Allow support for WebComponents and Shadow DOM

## Road map

* February 2022: First MVP version as v0.1.0 release candidate with understanding of component model and basic helper functions for creating of DOM trees
* March 2022: v0.1.0 and example projects with stateful and stateless components, event handling, interactive UI, conditional rendering
* April 2022: v0.2.0 with API documentation, examples with 3rd party state management libraries, support for "template" HTML-elements
* ...

## Basic ideas

## Components

User interfaces in browser's tabs are rendered HTML-documents with styles and JavaScript. To build complex UI using DOM there are common practics to break UI structure, appearance and logic into small reusable components.

First of all, let's clearify some terminology.

*Document tree* a.k.a. DOM-tree is a representation of HTML-document describing structure and logic of GUI elements in browser tab.

*Web engine* is a browser internal software component responsible to show and handle user interactions according to current DOM-tree in browser tab.

*Component* is a bunch of three independent layers with inherently different responsibilities:

* *Render function* is a function building DOM-tree fragment of content of the component's instances and possibly styles
* *Controller* is a stateful object with component behaviour that makes rendered DOM-tree fragment alive
* *Public interface* is an interface of component instance usage including creating an instance, obtaining and updating its state

*Component instance* is an object built by component factory. *Component factory* is a function (or method, or constructor) creating component instances by running the render function, creating a controller object and binding it with the rendered DOM-tree fragment.

Component instance has *Lifecycle* of three phases: rendering, mounting and unmounting.

*Component tree* is a tree of component instances built along with DOM tree during rendering phase.

Component may have logic of conditional rendering of its DOM-content. The content may change durung component instance lifetime. An instance could insert DOM-nodes in empty content or completely remove content. There is a problem of binding a component instance to place in DOM where it is responsible to insert or delete nodes. So, we have to introduce this abstraction explicilty.

*Place* is a reference to some node in component tree. When a component factory is called, it accept a place where created component instance will be bound. Every component instance remembers its place where it may insert its content.

