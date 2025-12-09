import { el, on, type PlaceholderComponent } from "rwrtw"

const Counter = (): PlaceholderComponent => {
  let counter = 0

  const counterText = `Hello world ${counter} times!`

  return el("div")(
    el("h1")("It Works!"),
    el("p", { class: "paragraph" })(counterText),
    el(
      "button",
      null,
      on("click", () => {
        counter = counter + 1
      }),
      on("focus", () => {
        console.log("Increment button is focused")
      }),
    )("Increment"),
    el("div")(counter % 2 === 0 ? el("p")("Even!") : el("p")("Odd!")),
  )
}

export default Counter
