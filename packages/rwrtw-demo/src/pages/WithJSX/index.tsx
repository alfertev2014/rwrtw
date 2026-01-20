import { computed, reContent, source, type TemplateContent } from "rwrtw"
import Counter from "./Counter.js"
import List from "./List/index.js"

const WithJSX = (): TemplateContent => {
  const selectedApp = source<string>("Counter")

  const handleClick = (selectedValue: string) => () => {
    selectedApp.change(selectedValue)
  }

  const TabButton = ({
    app,
    children,
  }: {
    app: string
    children: TemplateContent
  }) => (
    <button
      p:className={computed(() =>
        selectedApp.current() === app ? "app-selected" : undefined,
      )}
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
        {reContent(selectedApp, (value) => {
          switch (value) {
            case "Counter":
              return <Counter />
            case "List":
              return <List />
            default:
              return null
          }
        })}
      </div>
    </div>
  )
}

export default WithJSX
