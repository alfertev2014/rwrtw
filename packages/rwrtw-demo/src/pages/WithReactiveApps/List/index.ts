import {
  computed,
  effect,
  el,
  ev,
  fr,
  lc,
  listSource,
  Observable,
  on,
  PlaceholderComponent,
  reAttr,
  reCompute,
  reContent,
  reList,
  reProp,
  reText,
  Source,
  source,
} from "rwrtw"

import "./style.css"

const TextInput = (value: Source<string>): PlaceholderComponent => {
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

const Checkbox = (value: Source<boolean>): PlaceholderComponent => {
  return el(
    "input",
    {
      type: "checkbox",
    },
    reProp("checked", value),
    on("change", (e) => {
      value.change((e.target as HTMLInputElement).checked ?? false)
    }),
  )()
}

type Item = {
  id: number
  checked: boolean
  text: string
}

let idGenerator = 0

const createItem = (text: string, checked: boolean = false): Item => ({
  id: ++idGenerator,
  text,
  checked,
})

type ItemFormProps = {
  initItem: Observable<Item | null>
  onSave: (item: Item) => void
  onCancel: () => void
}

const ItemForm = ({ initItem, onSave, onCancel }: ItemFormProps) => {
  const textValue = source<string>("")
  const checked = source<boolean>(false)

  const eff = effect(initItem, (initValue) => {
    if (initValue) {
      textValue.change(initValue.text)
      checked.change(initValue.checked)
    } else {
      textValue.change("")
      checked.change(false)
    }
  })

  const handleClick = () => {
    onSave({
      id: initItem.current()?.id ?? idGenerator++,
      text: textValue.current(),
      checked: checked.current(),
    })
  }

  return fr(
    lc({
      dispose() {
        eff.unsubscribe()
      },
    }),
    el("span")(
      reText(
        computed(() =>
          initItem.current()?.id ? `[${initItem.current()?.id}]` : null,
        ),
      ),
    ),
    Checkbox(checked),
    TextInput(textValue),
    el("button", null, on("click", handleClick))("Save"),
    el("button", null, on("click", onCancel))("Cancel")
  )
}

const List = (): PlaceholderComponent => {
  const items = listSource<Item>(
    ["One", "Two", "Three", "Four", "Five", "Six", "Seven"].map((text) =>
      createItem(text),
    ),
  )
  
  const selectedItem = source<Item | null>(null)

  return el("div", { class: "list-container" })(
    el("h1")("Dynamic list"),
    el("ol", { class: "list-content" })(
      reList(items, (item) => {
        const id = computed(() => item.current().id)
        return el("li", { class: "list-item" })(
          el("span", { class: "list-item-id" })("[", reText(id), "]"),
          el("span", { class: "list-item-value" })(
            reText(
              computed(
                () =>
                  `[${item.current().checked ? "x" : " "}] ${item.current().text}`,
              ),
            ),
          ),
          el("span")(
            el(
              "button",
              null,
              on("click", () => {
                selectedItem.change(item.current())
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
            )("^"),
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
            )("v"),
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
      ItemForm({
        initItem: selectedItem,
        onSave: (item) => {
          const found = items.data.find(i => i.current().id === item.id)
          if (found) {
            found.change(item)
          } else {
            items.insertItem(items.data.length, item)
          }
        },
        onCancel: () => {
          selectedItem.change(null)
        }
      }),
    ),
  )
}

export default List
