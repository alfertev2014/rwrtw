import WithReactiveApps from "./pages/WithReactiveApps/index.js"
import LowLevelApps from "./pages/LowLevelApps/index.js"
import WithDslApps from "./pages/WithDslApps/index.js"
import {
  type PlaceholderComponent,
  type Source,
  type TemplateContent,
  computed,
  createRootPlaceholderAt,
  el,
  fr,
  on,
  placeAtBeginningOf,
  reClass,
  reIf,
  source,
} from "rwrtw"

import "./style.css"

type AppSectionType = "LowLevel" | "DSL" | "Reactive"

type AppSectionProps = {
  type: AppSectionType
  header: string
  activeSection: Source<AppSectionType>
}

const AppSection =
  ({ type, header, activeSection }: AppSectionProps) =>
  (children: TemplateContent) => {
    const expanded = computed(() => activeSection.current() === type)
    return el(
      "div",
      { class: "app-section" },
      reClass(
        "app-section-collapsed",
        computed(() => !expanded.current()),
      ),
    )(
      el(
        "h2",
        null,
        on("click", () => {
          activeSection.change(type)
        }),
      )(header),
      reIf(expanded, fr(children), null),
    )
  }

const App = (): PlaceholderComponent => {
  const activeSection = source<AppSectionType>("Reactive")
  return fr(
    el("h1")("RWRTW Demo"),
    el("div", { class: "main-layout" })(
      AppSection({ type: "LowLevel", header: "Low level apps", activeSection })(
        LowLevelApps(),
      ),
      AppSection({
        type: "DSL",
        header: "Apps with template DSL",
        activeSection,
      })(WithDslApps()),
      AppSection({
        type: "Reactive",
        header: "Apps with reactive",
        activeSection,
      })(WithReactiveApps()),
    ),
  )
}

const root = createRootPlaceholderAt(placeAtBeginningOf(document.body), App())
root.mount?.()
