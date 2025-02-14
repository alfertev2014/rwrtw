import {
  PlaceholderComponent,
  Switch,
  hel,
  placeAtBeginningOf,
  switchElse,
} from "rwrtw"
import Counter from "./Counter"

const LowLevelApps = (): PlaceholderComponent => (renderer) => {
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
    ),
    (appContainer = hel("div", { class: "app-container" })()),
  )

  switchElse(
    "Counter",
    [["Counter", Counter()]],
    null,
    (_) => (switchRef = _),
  )(renderer.createRendererAt(placeAtBeginningOf(appContainer)))

  renderer.insertNode(root)
}

export default LowLevelApps
