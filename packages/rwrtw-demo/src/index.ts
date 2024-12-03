import WithReactiveApps from "./pages/WithReactiveApps"
import LowLevelApps from "./pages/LowLevelApps"
import WithDslApps from "./pages/WithDslApps"
import {
  PlaceholderComponent,
  createRootPlaceholderAt,
  el,
  fr,
  placeAtBeginningOf,
} from "rwrtw"

import "./style.css"

const App = (): PlaceholderComponent => {
  const appSection = el("div", { class: "app-section" })
  return fr(
    el("h1")("RWRTW Demo"),
    el("div", { class: "main-layout" })(
      appSection(el("h2")("Low level apps"), LowLevelApps()),
      appSection(el("h2")("Apps with template DSL"), WithDslApps()),
      appSection(el("h2")("Apps with reactive"), WithReactiveApps()),
    ),
  )
}

const root = createRootPlaceholderAt(placeAtBeginningOf(document.body), App())
root.mount?.()
