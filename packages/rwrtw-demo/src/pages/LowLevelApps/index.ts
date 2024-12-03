import {
  PlaceholderComponent,
  Switch,
  hel,
  insertNodeAt,
  placeAtBeginningOf,
  switchElse,
} from "rwrtw"
import Counter from "./Counter"

const LowLevelApps = (): PlaceholderComponent => (place, context) => {
  let switchRef: Switch<string>
  let appContainer: HTMLElement

  const root = hel("div", { class: "apps-container" })(
    hel("div", { class: "apps-selector" })(
      (() => {
        const button = hel("button")("Counter")
        button.addEventListener("click", () => {
          switchRef.value = "Counter"
        })
        return button
      })(),
      (() => {
        const button = hel("button")("Temperature Converter")
        button.addEventListener("click", () => {
          switchRef.value = "TemperatureConverter"
        })
        return button
      })(),
    ),
    (appContainer = hel("div", { class: "app-container" })()),
  )

  const sw = switchElse(
    "Counter",
    [["Counter", Counter()]],
    null,
    (_) => (switchRef = _),
  )

  sw(placeAtBeginningOf(appContainer), context)

  return insertNodeAt(place, root)
}

export default LowLevelApps
