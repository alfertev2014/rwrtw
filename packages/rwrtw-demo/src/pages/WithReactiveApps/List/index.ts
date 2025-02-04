import {
  computed,
  effect,
  el,
  fr,
  lc,
  listFromArray,
  Observable,
  on,
  PlaceholderComponent,
  reAttr,
  reClass,
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

type ItemFormProps = {
  initItem: Observable<Item | null>
  onSave: (item: Item) => void
  onCancel: () => void
}

const ItemForm =
  ({ initItem, onSave, onCancel }: ItemFormProps): PlaceholderComponent =>
  (renderer) => {
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
        id: initItem.current()?.id ?? ++idGenerator,
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
      reContent(
        computed(() => initItem.current()?.id),
        (id) => (id ? el("span")(`[${id}]`) : null),
      ),
      Checkbox(checked),
      TextInput(textValue),
      el("button", null, on("click", handleClick))("Save"),
      el("button", null, on("click", onCancel))("Cancel"),
    )(renderer)
  }

const List = (): PlaceholderComponent => {
  const items = source<Item[]>(
    ["One", "Two", "Three", "Four", "Five", "Six", "Seven"].map((text) => ({
      id: ++idGenerator,
      text,
      checked: false,
    })),
  )

  const selectedId = source<number | null>(null)
  const selectedItem = computed(
    () => items.current().find((i) => i.id === selectedId.current()) ?? null,
  )
  const count = computed(() => items.current().length)
  const checkedCount = computed(
    () => items.current().filter((i) => i.checked).length,
  )

  return el("div", { class: "list-container" })(
    el("h1")("Dynamic list"),
    el("ol", { class: "list-content" })(
      reList(listFromArray(items), (item) => {
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
                items.update((items) => {
                  const index = items.findIndex(
                    (item) => item.id === id.current(),
                  )

                  if (index >= 0) {
                    const res = [...items]
                    const item = items[index]
                    res.splice(index, 1)
                    res.splice(0, 0, item)
                    return res
                  } else {
                    return items
                  }
                })
              }),
              reAttr("data-id", id),
            )("^"),

            el(
              "button",
              null,
              on("click", () => {
                items.update((items) => {
                  const index = items.findIndex(
                    (item) => item.id === id.current(),
                  )

                  if (index >= 0) {
                    const res = [...items]
                    const item = items[index]
                    res.splice(index, 1)
                    res.push(item)
                    return res
                  } else {
                    return items
                  }
                })
              }),
              reAttr("data-id", id),
            )("v"),

            el(
              "button",
              null,
              on("click", () =>
                items.update((items) =>
                  items.filter((i) => i.id !== id.current()),
                ),
              ),
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
          items.update((items) => {
            const found = items.find((i) => i.id === newItem.id)
            if (found) {
              return items.map((i) => (i.id === newItem.id ? newItem : i))
            } else {
              return items.concat([newItem])
            }
          })
        },
        onCancel: () => {
          selectedId.change(null)
        },
      }),
    ),
  )
}

export default List
