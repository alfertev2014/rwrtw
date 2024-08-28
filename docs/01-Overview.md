# RWRTW overview

## Motivation

Existing frameworks are overcomplicated and relatively heavy in comparison with small libraries. These are some of problems:

- Many abstraction layers which is almost always leaky.
- Vender locking. Easy to use solutions from one ecosystem but hard to integrate and compose with others.
- They could solve problems we are not interested for. But we have to pay for it with performance and learning time.
- The solutions of these contrived problems may lead to new problems a framework is responsible to solve.

Building UI using vanilla JS still requires writing boilerplate and is error prone. But modern JavaScript and new browser's APIs allow writing cleaner code without old utility libraries and without redundant abstraction layers such as jQuery.

There are some principles of software development that cannot be enforced using any library or framework in a project. A software developers still responsible to ensure it by themselves. There are always a lot of implicit conventions and assumptions in any code, especially in JavaScript code. No type checking system could express these conventions and assumptions. No static analysis tools could ensure all the conventions and assumptions. So, software developers still have to do this analysis by reading a code. OOP design patterns, SOLID, KISS, YAGNY, Clean Architecture, immutability, reactive programming are examples of such principles. Developer need not use any framework or library to ensure these principles.

## Goals

- An ability to develop UI applications as close to vanilla JS as possible using browser's APIs with only lightweight helper libraries.
- The libraries should bring only necessary abstractions and should not solve or create new contrived problems.
- The libraries are responsible to help in
  - creating UI components by component abstraction,
  - constructing DOM tree fragments and components tree (_view_),
  - binding constructed DOM trees (view) with view state (or _view model_), handling HTML events and forms
- The libraries should be ultimately composable with one another and possibly with other libraries.
- Usage of every library should be optional, every library should be replaceable with analogous solutions.
- Usage of the libraries should not require additional tools (any build tool should be optional)

## Not goals

- Toolkit to solve the whole stack of UI-development problems
- A library for full-fledged reactivity to bind model with view model
- A library for "state management"
- Sticking to one programming paradigm (OOP, FP, sync or async, declarative or imperative programming)
- Creating template languages with special syntax and additional build step
- Special integrations in build process (e.g. webpack loaders or plugins)

## Development principles and restrictions

- Zero runtime dependencies, only vanilla JS and browser's APIs
- Transparent logic for developers who knows HTML, CSS, DOM API, event handling, WebComponents etc.
- Implementation as close to DOM API as possible without tricky abstraction layers
- Minimal size of library is more important than peak performance
- Target modern JavaScript with native ES-modules in browser
- Developer experience in mind
- Actively use TypeScript and assume users of the libraries will also use TypeScript
- TypeScript should be in strict mode with thorough typings, prohibiting "any" and "object" types
- Be minification friendly:
  - Don't use string literals for property names
  - Don't analyze function parameters names
- Be tree-shaking friendly:
  - Fine-grained modularization
  - Don't tangle modules, minimize imports, don't create cyclic dependencies
  - Use statically resolvable exports
  - Don't add redundant dynamic polymorphism
- Try using less memory, don't create intermediate objects, arrays and lambdas without need
- Prohibit any JS prototypes modifications and monkey patching
- Prohibit creating of new properties on DOM Node objects and other built-in types
- Prohibit dangerous "innerHtml" modifications
- Don't create any hidden DOM-nodes for utility purposes such as nodes with "display: none", empty text nodes, comment nodes
- Don't do tricky metaprogramming with properties and parameters:
  - Don't assume naming conventions
  - Don't use computed property names
  - Don't invent any dependency injection
  - Don't use decorators
- Don't require any additional build step for special DSL (even JSX)
- Don't create any inner languages inside string literals:
  - Don't create any conventions about strings content
  - Don't parse any strings even using "split" or analyzing strings content char by char
