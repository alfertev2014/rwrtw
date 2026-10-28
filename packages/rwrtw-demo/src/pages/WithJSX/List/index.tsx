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
        value.change((e.target as HTMLInputElement).value)
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
        value.change((e.target as HTMLInputElement).checked)
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
    text: state<string>(initItem.current()?.text.current() ?? ""),
    checked: state<boolean>(initItem.current()?.checked.current() ?? false),
  }

  const handleClick = () => {
    batch(() => {
      onSave({
        text: itemForm.text.current(),
        checked: itemForm.checked.current(),
      })
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

const ListContent = ({
  items,
}: {
  items: ListState<Item>
}): TemplateContent => {
  const selectedItem = state<Item | null>(null)
  const count = computed(() => items.current().length)
  const checkedCount = computed(
    () =>
      items.current().filter((item) => item.current().checked.current()).length,
  )

  return (
    <>
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
              <div class="list-item-header">
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
                      selectedItem.change(item.current())
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
              </div>
              <div>
                <ListContent items={item.current().children} />
              </div>
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
            if (selectedItem.current() !== null) {
              selectedItem.current()?.checked.change(newItem.checked)
              selectedItem.current()?.text.change(newItem.text)
            } else {
              items.insertItem(items.current().length, {
                id: selectedItem.current()?.id ?? ++idGenerator,
                checked: state(newItem.checked),
                text: state(newItem.text),
                children: listState<Item>([]),
              })
            }
          }}
          onCancel={() => {
            selectedItem.change(null)
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
