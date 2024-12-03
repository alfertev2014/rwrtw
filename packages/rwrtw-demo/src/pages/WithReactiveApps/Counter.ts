import {
  computed,
  el,
  ev,
  fr,
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
    el("button", {
      click: ev(() => {
        counter.update((prev) => prev + 1)
      }),
      focus: ev(() => console.log("fuck")),
    })("Increment"),
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
