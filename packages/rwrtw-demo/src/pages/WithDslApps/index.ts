import {
  Dynamic,
  PlaceholderComponent,
  createRef,
  dyn,
  el,
  ev,
  ref,
} from "rwrtw"
import Counter from "./Counter"

const WithDslApps = (): PlaceholderComponent => {
  let selectedApp = "Counter"
  const selectedAppChanged: ((value: string) => void)[] = []
  const switchRef = createRef<Dynamic>()

  const handleClick = (selectedValue: string) => () => {
    selectedApp = selectedValue
    for (const handler of selectedAppChanged) {
      handler(selectedValue)
    }
  }

  selectedAppChanged.push(() => {
    switchRef?.current?.refresh()
  })

  const tabButton = (app: string) => {
    const b = createRef<HTMLButtonElement>()
    selectedAppChanged.push(() => {
      if (b.current != null) {
        b.current.className = selectedApp === app ? "app-selected" : ""
      }
    })
    return el(
      "button",
      {
        click: ev(handleClick(app)),
      },
      ref(b),
    )
  }

  return el("div", { class: "apps-container" })(
    el("div", { class: "apps-selector" })(
      tabButton("Counter")("Counter"),
      tabButton("TemperatureConverter")("Temperature converter"),
    ),
    el("div", { class: "app-container" })(
      dyn(() => {
        switch (selectedApp) {
          case "Counter":
            return Counter()
          default:
            return null
        }
      }, ref(switchRef)),
    ),
  )
}

export default WithDslApps
