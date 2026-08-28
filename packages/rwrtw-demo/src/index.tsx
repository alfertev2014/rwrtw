import {
  type TemplateContent,
  createRootPlaceholderAt,
  fr,
  placeAtBeginningOf,
} from "rwrtw"

import "./style.css"
import WithJSX from "./pages/WithJSX/index.js"

const f: CallableFunction

const App = (): TemplateContent => {
  return (
    <div class="main-layout">
      <div class="app-section">
        <WithJSX />
      </div>
    </div>
  )
}

const root = createRootPlaceholderAt(placeAtBeginningOf(document.body), fr(<App/>))
root.mount?.()
