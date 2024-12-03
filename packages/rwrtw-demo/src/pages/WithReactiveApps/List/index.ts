import {
  computed,
  createRef,
  effect,
  el,
  ev,
  fr,
  listSource,
  PlaceholderComponent,
  reAttr,
  reContent,
  reEv,
  ref,
  reList,
  Source,
  source,
} from "rwrtw"

import "./style.css"

const Input = (value: Source<string>): PlaceholderComponent => {
  const input = createRef<HTMLElement>()

  effect(value, (v) => {
    if (input.current) {
      ;(input.current as HTMLInputElement).value = v
    }
  })

  return el(
    "input",
    {
      type: "text",
      change: ev((e) => {
        value.change((e.target as HTMLInputElement).value ?? "")
      }),
    },
    ref(input),
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
          el("span", { class: "list-item-id" })(
            reContent(item, (value) => fr(`[${value.id}]`)),
          ),
          el("span", { class: "list-item-value" })(
            reContent(item, (value) => fr(`"${value.text}"`)),
          ),
          el("span")(
            el("button", {
              click: reEv(id, (id) => () => {
                const index = items.data.findIndex(
                  (item) => item.current().id === id,
                )
                if (index >= 0) {
                  items.moveItem(index, 0)
                }
              }),
              "data-id": reAttr(id),
            })("Edit"),
            " ",
            el("button", {
              click: reEv(id, (id) => () => {
                const index = items.data.findIndex(
                  (item) => item.current().id === id,
                )
                if (index >= 0) {
                  items.moveItem(index, 0)
                }
              }),
              "data-id": reAttr(id),
            })("Move to the top"),
            " ",

            el("button", {
              click: reEv(id, (id) => () => {
                const index = items.data.findIndex(
                  (item) => item.current().id === id,
                )
                if (index >= 0) {
                  items.moveItem(index, items.data.length - 1)
                }
              }),
              "data-id": reAttr(id),
            })("Move to the bottom"),
            " ",

            el("button", {
              click: reEv(id, (id) => () => {
                const index = items.data.findIndex(
                  (item) => item.current().id === id,
                )
                if (index >= 0) {
                  items.removeItem(index)
                }
              }),
              "data-id": reAttr(id),
            })("Remove"),
          ),
        )
      }),
    ),
    el("div", { class: "list-add-item-form" })(
      Input(newValue),
      el("button", {
        click: ev(() => {
          items.insertItem(items.data.length, createItem(newValue.current()))
          newValue.change("")
        }),
      })("Add"),
    ),
  )
}

export default List
