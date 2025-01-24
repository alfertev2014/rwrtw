import {
  hel,
  ifElse,
  IfElse,
  placeAtBeginningOf,
  PlaceholderComponent,
  txt,
} from "rwrtw"

const Counter = (): PlaceholderComponent => (renderer) => {
  let counter = 0
  let evenOdd: IfElse
  let hello: Text
  let button: HTMLElement
  let output: HTMLElement

  const handleClick = () => {
    hello.textContent = `Hello world ${++counter} times!`
    evenOdd.condition = counter % 2 === 0
  }

  renderer.insertNode(
    hel("div")(
      hel("h1")("It Works!"),
      hel("p", { class: "paragraph" })((hello = txt("Hello world!"))),
      (button = hel("button")("Increment")),
      (output = hel("div")()),
    ),
  )

  button.addEventListener("click", handleClick)

  ifElse(
    true,
    (renderer) => {
      renderer.insertNode(hel("p")("Even!"))
    },
    (renderer) => {
      renderer.insertNode(hel("span")("Odd!"))
    },
    (_) => (evenOdd = _),
  )(renderer.createRendererAt(placeAtBeginningOf(output)))
}

export default Counter
