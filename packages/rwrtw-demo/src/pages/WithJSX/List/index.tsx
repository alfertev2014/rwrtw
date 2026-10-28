import {
  batch,
  computed,
  type ListState,
  listState,
  type Signal,
  reContent,
  reEffect,
  reList,
  reText,
  type State,
  state,
  type TemplateContent,
} from "rwrtw"

import "./style.css"

const TextInput = ({ value }: { value: State<string> }): TemplateContent => {
  return (
    <input
      type="text"
      p:value={value}
      on:change={(e) => {
        value.set((e.target as HTMLInputElement).value)
      }}
    />
  )
}

const Checkbox = ({ value }: { value: State<boolean> }): TemplateContent => {
  return (
    <input
      type="checkbox"
      p:checked={value}
      on:change={(e) => {
        value.set((e.target as HTMLInputElement).checked)
      }}
    />
  )
}

type Item = {
  readonly id: number
  readonly checked: State<boolean>
  readonly text: State<string>
  readonly children: ListState<Item>
}

type ItemFormValues = {
  readonly checked: boolean
  readonly text: string
}

let idGenerator = 0

type ItemFormProps = {
  readonly initItem: Signal<Item | null>
  readonly onSave: (item: ItemFormValues) => void
  readonly onCancel: () => void
}

const ItemForm = ({
  initItem,
  onSave,
  onCancel,
}: ItemFormProps): TemplateContent => {
  const itemForm = {
    text: state<string>(initItem.get()?.text.get() ?? ""),
    checked: state<boolean>(initItem.get()?.checked.get() ?? false),
  }

  const handleClick = () => {
    batch(() => {
      onSave({
        text: itemForm.text.get(),
        checked: itemForm.checked.get(),
      })
    })
  }

  return (
    <>
      {reEffect(initItem, (initValue) => {
        if (initValue) {
          itemForm.text.set(initValue.text.get())
          itemForm.checked.set(initValue.checked.get())
        } else {
          itemForm.text.set("")
          itemForm.checked.set(false)
        }
      })}
      {reContent(
        computed(() => initItem.get()?.id),
        (id) => (id ? <span>[{id}]</span> : null),
      )}
      <Checkbox value={itemForm.checked} />
      <TextInput value={itemForm.text} />
      <button on:click={handleClick}>Save</button>
      <button on:click={onCancel}>Cancel</button>
    </>
  )
}

const ListContent = ({
  items,
}: {
  items: ListState<Item>
}): TemplateContent => {
  const selectedItem = state<Item | null>(null)
  const count = computed(() => items.get().length)
  const checkedCount = computed(
    () =>
      items.get().filter((item) => item.get().checked.get()).length,
  )

  return (
    <>
      <ol class="list-content">
        {reList(items, (item) => {
          const id = computed(() => item.get().id)
          return (
            <li
              class={computed(
                () =>
                  `list-item ${selectedItem.get()?.id === id.get() ? "list-item-selected" : ""}`,
              )}
            >
              <div class="list-item-header">
                <span class="list-item-id">
                  {reText(computed(() => `[${id.get()}]`))}
                </span>
                <span class="list-item-value">
                  {reText(
                    computed(
                      () =>
                        `[${item.get().checked.get() ? "x" : " "}] ${item.get().text.get()}`,
                    ),
                  )}
                </span>
                <span class="list-item-actions">
                  <button
                    on:click={() => {
                      selectedItem.set(item.get())
                    }}
                    data-id={id}
                  >
                    Edit
                  </button>
                  <button
                    on:click={() => {
                      const index = items
                        .get()
                        .findIndex((item) => item.get().id === id.get())

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
                        .get()
                        .findIndex((item) => item.get().id === id.get())

                      if (index >= 0) {
                        items.moveItem(index, items.get().length - 1)
                      }
                    }}
                    data-id={id}
                  >
                    v
                  </button>

                  <button
                    on:click={() => {
                      const index = items
                        .get()
                        .findIndex((item) => item.get().id === id.get())

                      items.removeItem(index)
                    }}
                    data-id={id}
                  >
                    Remove
                  </button>
                </span>
              </div>
              <div>
                <ListContent items={item.get().children} />
              </div>
            </li>
          )
        })}
        <hr />
        <div>
          <span>
            {reText(
              computed(() => `${checkedCount.get()} / ${count.get()}`),
            )}
          </span>
        </div>
      </ol>
      <div class="list-add-item-form">
        <ItemForm
          initItem={selectedItem}
          onSave={(newItem) => {
            if (selectedItem.get() !== null) {
              selectedItem.get()?.checked.set(newItem.checked)
              selectedItem.get()?.text.set(newItem.text)
            } else {
              items.insertItem(items.get().length, {
                id: selectedItem.get()?.id ?? ++idGenerator,
                checked: state(newItem.checked),
                text: state(newItem.text),
                children: listState<Item>([]),
              })
            }
          }}
          onCancel={() => {
            selectedItem.set(null)
          }}
        />
      </div>
    </>
  )
}

const List = (): TemplateContent => {
  const items = listState<Item>(
    ["One", "Two", "Three", "Four", "Five", "Six", "Seven"].map((text) => ({
      id: ++idGenerator,
      text: state<string>(text),
      checked: state<boolean>(false),
      children: listState<Item>([]),
    })),
  )

  return (
    <div class="list-container">
      <h1>Dynamic list</h1>
      <ListContent items={items} />
    </div>
  )
}

export default List
