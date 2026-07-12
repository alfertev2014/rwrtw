import {
  type PlaceholderComponent,
  createRootPlaceholderAt,
  fr,
  placeAtBeginningOf,
} from "rwrtw"

import "./style.css"
import WithJSX from "./pages/WithJSX/index.js"

const App = (): PlaceholderComponent => {
  return fr(
    <div class="main-layout">
      <div class="app-section">
        <WithJSX />
      </div>
    </div>
  )
}

const root = createRootPlaceholderAt(placeAtBeginningOf(document.body), App())
root.mount?.()
