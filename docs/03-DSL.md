
# RWRTW template DSL

**Temlate DSL** is an *internal DSL* which allows to build component trees in a declarative way with strict type checking. "Internal" means that the DSL constructions are regular TypeScript expressions. So, TypeScript is the *host language*. The DSL's grammar, parsing, semantics and error handling are implemented as a TypeScripl library with heavy use of type checking.

The following is the fragment of the Counter app example:

```typescript
el("div")(
  el("h1")("It Works!"),
  el("p", { class: "paragraph" }, ref(hello))("Hello world!"),
  el("button", {
    click: ev(handleClick),
    focus: ev(() => console.log("focus!")),
  })("Increment"),
  el("div")(ifElse(true, el("p")("Even!"), el("span")("Odd!"), ref(evenOdd)))
)
```

Or with abbreviations:

```typescript
div()(
  h1()("It Works!"),
  p({ class: "paragraph" }, ref(hello))("Hello world!"),
  button({
    click: ev(handleClick),
    focus: ev(() => console.log("focus!")),
  })("Increment"),
  div()(ifElse(true, p()("Even!"), span()("Odd!"), ref(evenOdd)))
)
```

The DSL contains building blocks for native HTML elements, primitives for conditional content and dynamic lists, and utilities for binding controllers to DOM-nodes. The DSL simplifies describing components and its composition. Content of components including DOM-trees, placeholders and dynamic lists can be build with higher level constructions. Components' lifecycle is handled under the hood.

## DSL primitives

There are the three primitive construction to build extended DOM trees:

* `el` - HTML element
* `plh` - placeholder
* `plhList` - dynamic list of placeholders

Also, there are util primitives:

* `fr` - template fragment
* `lc` - lifecycle hooks

Every DSL primitive function returns controller factory function with sigrature (place, context) => void. But a developer could not think about places and lifecycle at all when using these building blocks together. Expression composition hides those complex details from developers.

### HTML element

Native HTML elements can be built with `el` factory function. It is high-order function which accepts HTML-tag, configuration object with attributes, event listeners, and other handlers which are to be called in rendering phace. `el` returns other function which accepts multiple children.

These are some examples:

```typescript
// div element without children
el("div")()

// span element with 'highlighted' CSS-class and "Some text content" as text content
el("span", { class: "highlighted" })("Some text content")

// div element with h3 heading text and unordered list of items
el("div")(
  el("h3")("Heading"),
  el("ul", { class: "unordered-list" })(
    el("li", { class: "list-item" })("One"),
    el("li", { class: "list-item" })("Two"),
    el("li", { class: "list-item" })("Three"),
  )
)

el("form", { novalidate: true, submit: ev((event) => { /* ....  */ })})(
  el("div", { class: "form-field" })(
    el("label", { "for": "username" })("Username:"), el("input", { type: "text", name: "username" })(),
  ),
  el("div", { class: "form-field" })(
    el("label", { "for": "password" })("Password:"), el("input", { type: "password", name: "password" })(),
  )
)

```

### Placeholder

Placeholders can be created with `plh` function which accepts arbitrary component function as initial content and a callback function to access to placeholder instance.

```typescript
let aPlaceholder: Placeholder

const content = el("div")(
  plh(el("div")("Some initial content"), (placeholder, context) => {
    aPlaceholder = placeholder
  })
)

createRootPlaceholderAt(placeAtBeginningOf(document.body), content)

aPlaceholder.replaceContent(el("div")("Some ", el("span", { class: "text-emphasize" })("modified"), " content"))

```

## DSL component composition

## DSL's refs

## DSL principles and restrictions

## Interaction with imperative and reactive programming

