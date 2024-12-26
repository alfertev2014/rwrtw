import {
  computed,
  el,
  ev,
  fr,
  on,
  PlaceholderComponent,
  reContent,
  reIf,
  source,
} from "rwrtw"

const Counter = (): PlaceholderComponent => {
  const counter = source<number>(0)

  return el("div")(
    el("h1")("It Works!"),
    el("p", { class: "paragraph" })(
      reContent(counter, () => fr(`Hello world ${counter.current()} times!`)),
    ),
    el(
      "button",
      null,
      on("click", () => {
        counter.update((prev) => prev + 1)
      }),
      on("focus", () => {
        console.log("fuck")
      }),
    )("Increment"),
    el("div")(
      reIf(
        computed(() => counter.current() % 2 === 0),
        el("p")("Even!"),
        el("span")("Odd!"),
      ),
    ),
  )
}

export default Counter
