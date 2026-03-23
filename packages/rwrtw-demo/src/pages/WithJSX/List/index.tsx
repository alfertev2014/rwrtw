import {
  computed,
  listSource,
  type Observable,
  reContent,
  reEffect,
  reList,
  reText,
  type Source,
  source,
  type TemplateContent,
} from "rwrtw"

import "./style.css"

const TextInput = ({ value }: { value: Source<string> }): TemplateContent => {
  return (
    <input
      type="text"
      p:value={value}
      on:change={(e) => {
        value.change((e.target as HTMLInputElement).value)
      }}
    />
  )
}

const Checkbox = ({ value }: { value: Source<boolean> }): TemplateContent => {
  return (
    <input
      type="checkbox"
      p:checked={value}
      on:change={(e) => {
        value.change((e.target as HTMLInputElement).checked)
      }}
    />
  )
}

type Item = {
  readonly id: number
  readonly checked: Source<boolean>
  readonly text: Source<string>
}

let idGenerator = 0

type ItemFormProps = {
  readonly initItem: Observable<Item | null>
  readonly onSave: (item: Item) => void
  readonly onCancel: () => void
}

const ItemForm = ({
  initItem,
  onSave,
  onCancel,
}: ItemFormProps): TemplateContent => {
  const itemForm = {
    text: source<string>(initItem.current()?.text.current() ?? ""),
    checked: source<boolean>(initItem.current()?.checked.current() ?? false)
  };

  const handleClick = () => {
    onSave({
      id: initItem.current()?.id ?? ++idGenerator,
      text: source<string>(itemForm.text.current()),
      checked: source<boolean>(itemForm.checked.current()),
    })
  }

  return (
    <>
      {reEffect(initItem, (initValue) => {
        if (initValue) {
          itemForm.text.change(initValue.text.current())
          itemForm.checked.change(initValue.checked.current())
        } else {
          itemForm.text.change("")
          itemForm.checked.change(false)
        }
      })}
      {reContent(
        computed(() => initItem.current()?.id),
        (id) => (id ? <span>[{id}]</span> : null),
      )}
      <Checkbox value={itemForm.checked} />
      <TextInput value={itemForm.text} />
      <button on:click={handleClick}>Save</button>
      <button on:click={onCancel}>Cancel</button>
    </>
  )
}

const List = (): TemplateContent => {
  const items = listSource<Item>(
    ["One", "Two", "Three", "Four", "Five", "Six", "Seven"].map((text) => ({
      id: ++idGenerator,
      text: source<string>(text),
      checked: source<boolean>(false),
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
    () => items.current().filter((item) => item.current().checked.current()).length,
  )

  return (
    <div class="list-container">
      <h1>Dynamic list</h1>
      <ol class="list-content">
        {reList(items, (item) => {
          const id = computed(() => item.current().id)
          return (
            <li
              class={computed(
                () =>
                  `list-item ${selectedItem.current()?.id === id.current() ? "list-item-selected" : ""}`,
              )}
            >
              <span class="list-item-id">
                {reText(computed(() => `[${id.current()}]`))}
              </span>
              <span class="list-item-value">
                {reText(
                  computed(
                    () =>
                      `[${item.current().checked.current() ? "x" : " "}] ${item.current().text.current()}`,
                  ),
                )}
              </span>
              <span class="list-item-actions">
                <button
                  on:click={() => {
                    selectedId.change(id.current())
                  }}
                  data-id={id}
                >
                  Edit
                </button>
                <button
                  on:click={() => {
                    const index = items
                      .current()
                      .findIndex((item) => item.current().id === id.current())

                    if (index >= 0) {
                      items.moveItem(index, 0)
                    }
                  }}
                  data-id={id}
                >
                  ^
                </button>
                <button
                  on:click={() => {
                    const index = items
                      .current()
                      .findIndex((item) => item.current().id === id.current())

                    if (index >= 0) {
                      items.moveItem(index, items.current().length - 1)
                    }
                  }}
                  data-id={id}
                >
                  v
                </button>

                <button
                  on:click={() => {
                    const index = items
                      .current()
                      .findIndex((item) => item.current().id === id.current())

                    items.removeItem(index)
                  }}
                  data-id={id}
                >
                  Remove
                </button>
              </span>
            </li>
          )
        })}
        <hr />
        <div>
          <span>
            {reText(
              computed(() => `${checkedCount.current()} / ${count.current()}`),
            )}
          </span>
        </div>
      </ol>
      <div class="list-add-item-form">
        <ItemForm
          initItem={selectedItem}
          onSave={(newItem) => {
            const index = items
              .current()
              .findIndex((item) => item.current().id === newItem.id)
            if (index >= 0) {
              items.current()[index].change(newItem)
            } else {
              items.insertItem(items.current().length, newItem)
            }
          }}
          onCancel={() => {
            selectedId.change(null)
          }}
        />
      </div>
    </div>
  )
}

export default List
