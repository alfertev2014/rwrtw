import {
  computed,
  el,
  ev,
  fr,
  listSource,
  on,
  PlaceholderComponent,
  reAttr,
  reContent,
  reList,
  reProp,
  reText,
  Source,
  source,
} from "rwrtw"

import "./style.css"

const Input = (value: Source<string>): PlaceholderComponent => {
  return el(
    "input",
    {
      type: "text",
    },
    reProp("value", value),
    on("change", (e) => {
      value.change((e.target as HTMLInputElement).value ?? "")
    }),
  )()
}

type Item = {
  id: number
  text: string
}

let idGenerator = 0

const createItem = (text: string): Item => ({
  id: ++idGenerator,
  text,
})

const List = (): PlaceholderComponent => {
  const items = listSource<Item>(
    ["One", "Two", "Three", "Four", "Five", "Six", "Seven"].map(createItem),
  )
  const newValue = source<string>("")
  return el("div", { class: "list-container" })(
    el("h1")("Dynamic list"),
    el("ol", { class: "list-content" })(
      reList(items, (item) => {
        const id = computed(() => item.current().id)
        return el("li", { class: "list-item" })(
          el("span", { class: "list-item-id" })("[", reText(id), "]"),
          el("span", { class: "list-item-value" })(
            reText(computed(() => item.current().text)),
          ),
          el("span")(
            el(
              "button",
              null,
              on("click", () => {
                const index = items.data.findIndex(
                  (item) => item.current().id === id.current(),
                )
                if (index >= 0) {
                  items.moveItem(index, 0)
                }
              }),
              reAttr("data-id", id),
            )("Edit"),
            " ",
            el(
              "button",
              null,
              on("click", () => {
                const index = items.data.findIndex(
                  (item) => item.current().id === id.current(),
                )
                if (index >= 0) {
                  items.moveItem(index, 0)
                }
              }),
              reAttr("data-id", id),
            )("Move to the top"),
            " ",

            el(
              "button",
              null,
              on("click", () => {
                const index = items.data.findIndex(
                  (item) => item.current().id === id.current(),
                )
                if (index >= 0) {
                  items.moveItem(index, items.data.length - 1)
                }
              }),
              reAttr("data-id", id),
            )("Move to the bottom"),
            " ",

            el(
              "button",
              null,
              on("click", () => {
                const index = items.data.findIndex(
                  (item) => item.current().id === id.current(),
                )
                if (index >= 0) {
                  items.removeItem(index)
                }
              }),
              reAttr("data-id", id),
            )("Remove"),
          ),
        )
      }),
    ),
    el("div", { class: "list-add-item-form" })(
      Input(newValue),
      el(
        "button",
        null,
        on("click", () => {
          items.insertItem(items.data.length, createItem(newValue.current()))
          newValue.change("")
        }),
      )("Add"),
    ),
  )
}

export default List
