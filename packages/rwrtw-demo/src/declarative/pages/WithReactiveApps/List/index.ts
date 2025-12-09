import {
  el,
  fr,
  on,
  type PlaceholderComponent,
  reAttr,
  reClass,
  reEffect,
  reProp,
} from "rwrtw"

import "./style.css"

const TextInput = ({ value }: { value: string }): PlaceholderComponent => {
  return el(
    "input",
    {
      type: "text",
    },
    reProp("value", value),
    on("change", (e) => {
      value = (e.target as HTMLInputElement).value
    }),
  )()
}

const Checkbox = ({ value }: { value: boolean }): PlaceholderComponent => {
  return el(
    "input",
    {
      type: "checkbox",
    },
    reProp("checked", value),
    on("change", (e) => {
      value = (e.target as HTMLInputElement).checked
    }),
  )()
}

type Item = {
  id: number
  checked: boolean
  text: string
}

let idGenerator = 0

type ItemFormProps = {
  initItem: Item | null
  onSave: (item: Item) => void
  onCancel: () => void
}

const ItemForm = ({
  initItem,
  onSave,
  onCancel,
}: ItemFormProps): PlaceholderComponent => {
  let textValue = ""
  let checked = false

  const handleClick = () => {
    onSave({
      id: initItem?.id ?? ++idGenerator,
      text: textValue,
      checked,
    })
  }

  return fr(
    reEffect(initItem, (initValue) => {
      if (initValue) {
        textValue = initValue.text
        checked = initValue.checked
      } else {
        textValue = ""
        checked = false
      }
    }),
    initItem?.id ? el("span")(`[${initItem.id}]`) : null,
    Checkbox({ value: checked }),
    TextInput({ value: textValue }),
    el("button", null, on("click", handleClick))("Save"),
    el("button", null, on("click", onCancel))("Cancel"),
  )
}

const List = (): PlaceholderComponent => {
  const items: Item[] = 
    ["One", "Two", "Three", "Four", "Five", "Six", "Seven"].map((text) => ({
      id: ++idGenerator,
      text,
      checked: false,
    }))
  

  let selectedId: number | null = null
  const selectedItem = items.find((item) => item.id === selectedId) ?? null
  const count = items.length
  const checkedCount = items.filter((item) => item.checked).length

  return el("div", { class: "list-container" })(
    el("h1")("Dynamic list"),
    el("ol", { class: "list-content" })(
      items.map((item, index) => {
        const id = item.id
        return el(
          "li",
          { class: "list-item" },
          reClass(
            "list-item-selected",
            selectedItem?.id === id,
          ),
        )(
          el("span", { class: "list-item-id" })(
            `[${id}]`,
          ),
          el("span", { class: "list-item-value" })(
            `[${item.checked ? "x" : " "}] ${item.text}`,
          ),
          el("span", { class: "list-item-actions" })(
            el(
              "button",
              null,
              on("click", () => {
                selectedId = id
              }),
              reAttr("data-id", id),
            )("Edit"),
            el(
              "button",
              null,
              on("click", () => {
                if (index >= 0) {
                  items.moveItem(index, 0)
                }
              }),
              reAttr("data-id", id),
            )("^"),

            el(
              "button",
              null,
              on("click", () => {
                if (index >= 0) {
                  items.moveItem(index, items.length - 1)
                }
              }),
              reAttr("data-id", id),
            )("v"),

            el(
              "button",
              null,
              on("click", () => {
                items.removeItem(index)
              }),
              reAttr("data-id", id),
            )("Remove"),
          ),
        )
      }),
      el("hr")(),
      el(
        "div",
      )(
        el("span")(`${checkedCount} / ${count}`),
      ),
    ),
    el("div", { class: "list-add-item-form" })(
      ItemForm({
        initItem: selectedItem,
        onSave: (newItem) => {
          const index = items
            .findIndex((item) => item.id === newItem.id)
          if (index >= 0) {
            items[index] = newItem
          } else {
            items.insertItem(items.length, newItem)
          }
        },
        onCancel: () => {
          selectedId = null
        },
      }),
    ),
  )
}

export default List
