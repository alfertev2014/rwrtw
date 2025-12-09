import WithReactiveApps from "./pages/WithReactiveApps/index.js"
import {
  type PlaceholderComponent,
  type TemplateContent,
  createRootPlaceholderAt,
  el,
  fr,
  placeAtBeginningOf,
} from "rwrtw"

import "./style.css"

type AppSectionProps = {
  header: string
}

const AppSection =
  ({ header }: AppSectionProps) =>
  (children: TemplateContent) => {
    return el("div", { class: "app-section" })(el("h2")(header), fr(children))
  }

const App = (): PlaceholderComponent => {
  return fr(
    el("h1")("RWRTW Demo"),
    el("div", { class: "main-layout" })(
      AppSection({
        header: "Apps with reactive",
      })(WithReactiveApps()),
    ),
  )
}

const root = createRootPlaceholderAt(placeAtBeginningOf(document.body), App())
root.mount?.()
