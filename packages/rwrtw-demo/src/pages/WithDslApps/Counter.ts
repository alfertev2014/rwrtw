import {
  createRef,
  el,
  ifElse,
  IfElse,
  on,
  PlaceholderComponent,
  ref,
} from "rwrtw"

const Counter = (): PlaceholderComponent => {
  let counter = 0
  const evenOdd = createRef<IfElse>()
  const hello = createRef<HTMLParagraphElement>()

  function handleClick(this: HTMLButtonElement) {
    if (hello.current) {
      hello.current.textContent = `Hello world ${++counter} times!`
    }
    if (evenOdd.current) {
      evenOdd.current.condition = counter % 2 === 0
    }
  }

  return el("div")(
    el("h1")("It Works!"),
    el("p", { class: "paragraph" }, ref(hello))("Hello world!"),
    el(
      "button",
      null,
      on("click", handleClick),
      on("focus", () => console.log("focus!")),
    )("Increment"),
    el("div")(ifElse(true, el("p")("Even!"), el("span")("Odd!"), ref(evenOdd))),
  )
}

export default Counter
