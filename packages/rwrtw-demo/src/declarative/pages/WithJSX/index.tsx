import { type TemplateContent } from "rwrtw"
import Counter from "./Counter.js"
import List from "./List/index.js"

const WithJSX = (): TemplateContent => {
  let selectedApp = "Counter"

  const handleClick = (selectedValue: string) => () => {
    selectedApp = selectedValue
  }

  const TabButton = ({
    app,
    children,
  }: {
    app: string
    children: TemplateContent
  }) => (
    <button
      p:className={selectedApp === app ? "app-selected" : undefined}
      on:click={handleClick(app)}
    >
      {children}
    </button>
  )

  return (
    <div class="apps-container">
      <div class="apps-selector">
        <TabButton app="Counter">Counter</TabButton>
        <TabButton app="List">List</TabButton>
      </div>
      <div class="app-container">
        {selectedApp ===  "Counter" ? <Counter />
          : selectedApp === "List" ? <List />
          : null
        }
      </div>
    </div>
  )
}

export default WithJSX
