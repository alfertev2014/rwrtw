import {
  computed,
  el,
  on,
  PlaceholderComponent,
  reAttr,
  reContent,
  source,
} from "rwrtw"
import Counter from "./Counter"
import List from "./List"

const WithReactiveApps = (): PlaceholderComponent => {
  const selectedApp = source<string>("Counter")

  const handleClick = (selectedValue: string) => () => {
    selectedApp.change(selectedValue)
  }

  const tabButton = (app: string) =>
    el(
      "button",
      null,
      reAttr(
        "class",
        computed(() => (selectedApp.current() === app ? "app-selected" : null)),
      ),
      on("click", handleClick(app)),
    )

  return el("div", { class: "apps-container" })(
    el("div", { class: "apps-selector" })(
      tabButton("Counter")("Counter"),
      tabButton("TemperatureConverter")("Temperature converter"),
      tabButton("List")("List"),
    ),
    el("div", { class: "app-container" })(
      reContent(selectedApp, (value) => {
        switch (value) {
          case "Counter":
            return Counter()
          case "List":
            return List()
          default:
            return null
        }
      }),
    ),
  )
}

export default WithReactiveApps
