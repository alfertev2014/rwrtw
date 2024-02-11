# RWRTW

RWRTW is a simple library for building UI components with browser's DOM API. It contains tiny DOM helpers and minimal building blocks to structure and manage UI component trees with view state logic and handle its lifecycle.

## Concepts and ideas

RWRTW is set of libraries for UI development. Usually interactive UI is made of UI-components. These UI-components are composable into more complex UI-components. Every UI-component is responsible to implement interactivity in small part of UI. Interactive UI is usually represented in three layers:

* **Model** - application state with business logic
* **View** - presentation layer with styles, layout and user input handling
* **View model** - mutable state of presentation layer

The View part is mostly implemented in HTML and CSS, so RWRTW just create thin extension layer for DOM API to make UI interactivity in easy and concise way with TypeScript. The main role of RWRTW in UI-application development is to bind HTML/CSS-views (DOM) with internal view-state so that the view-state could be bound to model where business logic is abstracted of presentation layer.

So, the whole RWRTW project consists of three parts:

* **Core** primitives for DOM manipulation as building blocks for UI components with view model
* Template **DSL** with strict typings to declaratively organize core primitives into components
* **Reactive** primitives to manage view state and handle reactive view updates

Also, there is an integration layer between reactive primitives and template DSL.

The Template DSL and reactive library are just examples of how the core primitives could be used. The DSL and reactive can be replaced with other existing libraries. For example, it is possible to implement template DSL as JSX. Some reactive libraries like MobX could be used instead of built-in reactive implementation.

The documentation is parted into next several pages:

* [Overview and motivation](01-Overview.md) - tells goals and design principles
* [Core](02-Core.md) - explains core primitives for components implementation
* [Templates DSL](03-DSL.md) - describes building components with declarative markup DSL in TypeScript
* [Built-in components](04-Components.md) - for using built-in components
* [Reactive](05-Reactive.md) - for reactive library and primitives

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
