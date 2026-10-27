import {
  type TemplateContent,
  createRootDynamicNodeAt,
  fr,
  placeAtBeginningOf,
} from "rwrtw"

import "./style.css"
import WithJSX from "./pages/WithJSX/index.js"

const App = (): TemplateContent => {
  return (
    <div class="main-layout">
      <div class="app-section">
        <WithJSX />
      </div>
    </div>
  )
}

const root = createRootDynamicNodeAt(
  placeAtBeginningOf(document.body),
  fr(<App />),
)
root.mount?.()
