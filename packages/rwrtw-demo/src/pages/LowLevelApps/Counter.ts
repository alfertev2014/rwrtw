import {
  hel,
  ifElse,
  IfElse,
  insertNodeAt,
  placeAtBeginningOf,
  PlaceholderComponent,
  txt,
} from "rwrtw"

const Counter = (): PlaceholderComponent => (place, context) => {
  let counter = 0
  let evenOdd: IfElse
  let hello: Text
  let button: HTMLElement
  let output: HTMLElement

  const handleClick = () => {
    hello.textContent = `Hello world ${++counter} times!`
    evenOdd.condition = counter % 2 === 0
  }

  const root = insertNodeAt(
    place,
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
    (place, context) => {
      return insertNodeAt(place, hel("p")("Even!"))
    },
    (place, context) => {
      return insertNodeAt(place, hel("span")("Odd!"))
    },
    (_) => (evenOdd = _),
  )(placeAtBeginningOf(output), context)

  return root
}

export default Counter
