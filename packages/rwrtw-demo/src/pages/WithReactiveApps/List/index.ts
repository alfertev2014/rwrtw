import {
  computed,
  el,
  fr,
  listSource,
  type Observable,
  on,
  type PlaceholderComponent,
  reAttr,
  reClass,
  reContent,
  reEffect,
  reList,
  reProp,
  reText,
  type Source,
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
      value.change((e.target as HTMLInputElement).value)
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
      value.change((e.target as HTMLInputElement).checked)
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
  initItem: Observable<Item | null>
  onSave: (item: Item) => void
  onCancel: () => void
}

const ItemForm = ({
  initItem,
  onSave,
  onCancel,
}: ItemFormProps): PlaceholderComponent => {
  const textValue = source<string>("")
  const checked = source<boolean>(false)

  const handleClick = () => {
    onSave({
      id: initItem.current()?.id ?? ++idGenerator,
      text: textValue.current(),
      checked: checked.current(),
    })
  }

  return fr(
    reEffect(initItem, (initValue) => {
      if (initValue) {
        textValue.change(initValue.text)
        checked.change(initValue.checked)
      } else {
        textValue.change("")
        checked.change(false)
      }
    }),
    reContent(
      computed(() => initItem.current()?.id),
      (id) => (id ? el("span")(`[${id}]`) : null),
    ),
    Checkbox(checked),
    TextInput(textValue),
    el("button", null, on("click", handleClick))("Save"),
    el("button", null, on("click", onCancel))("Cancel"),
  )
}

const List = (): PlaceholderComponent => {
  const items = listSource<Item>(
    ["One", "Two", "Three", "Four", "Five", "Six", "Seven"].map((text) => ({
      id: ++idGenerator,
      text,
      checked: false,
    })),
  )

  const selectedId = source<number | null>(null)
  const selectedItem = computed(
    () =>
      items
        .current()
        .find((item) => item.current().id === selectedId.current())
        ?.current() ?? null,
  )
  const count = computed(() => items.current().length)
  const checkedCount = computed(
    () => items.current().filter((item) => item.current().checked).length,
  )

  return el("div", { class: "list-container" })(
    el("h1")("Dynamic list"),
    el("ol", { class: "list-content" })(
      reList(items, (item) => {
        const id = computed(() => item.current().id)
        return el(
          "li",
          { class: "list-item" },
          reClass(
            "list-item-selected",
            computed(() => selectedItem.current()?.id === id.current()),
          ),
        )(
          el("span", { class: "list-item-id" })(
            reText(computed(() => `[${id.current()}]`)),
          ),
          el("span", { class: "list-item-value" })(
            reText(
              computed(
                () =>
                  `[${item.current().checked ? "x" : " "}] ${item.current().text}`,
              ),
            ),
          ),
          el("span", { class: "list-item-actions" })(
            el(
              "button",
              null,
              on("click", () => {
                selectedId.change(id.current())
              }),
              reAttr("data-id", id),
            )("Edit"),
            el(
              "button",
              null,
              on("click", () => {
                const index = items
                  .current()
                  .findIndex((item) => item.current().id === id.current())

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
                const index = items
                  .current()
                  .findIndex((item) => item.current().id === id.current())

                if (index >= 0) {
                  items.moveItem(index, items.current().length - 1)
                }
              }),
              reAttr("data-id", id),
            )("v"),

            el(
              "button",
              null,
              on("click", () => {
                const index = items
                  .current()
                  .findIndex((item) => item.current().id === id.current())

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
        {},
      )(
        el("span")(
          reText(
            computed(() => `${checkedCount.current()} / ${count.current()}`),
          ),
        ),
      ),
    ),
    el("div", { class: "list-add-item-form" })(
      ItemForm({
        initItem: selectedItem,
        onSave: (newItem) => {
          const index = items
            .current()
            .findIndex((item) => item.current().id === newItem.id)
          if (index >= 0) {
            items.current()[index].change(newItem)
          } else {
            items.insertItem(items.current().length, newItem)
          }
        },
        onCancel: () => {
          selectedId.change(null)
        },
      }),
    ),
  )
}

export default List
