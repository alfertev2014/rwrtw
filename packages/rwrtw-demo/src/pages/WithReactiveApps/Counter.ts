import {
  computed,
  el,
  on,
  PlaceholderComponent,
  reIf,
  reText,
  source,
} from "rwrtw"

const Counter = (): PlaceholderComponent => {
  const counter = source<number>(0)

  return el("div")(
    el("h1")("It Works!"),
    el("p", { class: "paragraph" })(
      reText(computed(() => `Hello world ${counter.current()} times!`)),
    ),
    el(
      "button",
      null,
      on("click", () => {
        counter.update((prev) => prev + 1)
      }),
      on("focus", () => {
        console.log("Increment button is focused")
      }),
    )("Increment"),
    el("div")(
      reIf(
        computed(() => counter.current() % 2 === 0),
        el("p")("Even!"),
        el("p")("Odd!"),
      ),
    ),
  )
}

export default Counter
