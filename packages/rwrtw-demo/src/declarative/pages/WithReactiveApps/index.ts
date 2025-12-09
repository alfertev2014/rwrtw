import {
  el,
  on,
  type PlaceholderComponent,
  reClass,
} from "rwrtw"
import Counter from "./Counter.js"
import List from "./List/index.js"

const WithReactiveApps = (): PlaceholderComponent => {
  let selectedApp = "Counter"

  const handleClick = (selectedValue: string) => () => {
    selectedApp = selectedValue
  }

  const tabButton = (app: string) =>
    el(
      "button",
      null,
      reClass(
        "app-selected",
        selectedApp === app,
      ),
      on("click", handleClick(app)),
    )

  return el("div", { class: "apps-container" })(
    el("div", { class: "apps-selector" })(
      tabButton("Counter")("Counter"),
      tabButton("List")("List"),
    ),
    el("div", { class: "app-container" })(
      (() => {
        switch (selectedApp) {
          case "Counter":
            return Counter()
          case "List":
            return List()
          default:
            return null
        }
      })(),
    ),
  )
}

export default WithReactiveApps
