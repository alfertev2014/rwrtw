import { type TemplateContent } from "rwrtw"

import "./style.css"
import WithJSX from "./pages/WithJSX/index.decl.js"

export const App = (): TemplateContent => {
  return (
    <div class="main-layout">
      <div class="app-section">
        <WithJSX />
      </div>
    </div>
  )
}
