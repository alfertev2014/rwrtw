import {
  computed,
  type ListSource,
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
  readonly children: ListSource<Item>
}

type ItemFormValues = {
  readonly checked: Source<boolean>
  readonly text: Source<string>
}

let idGenerator = 0

type ItemFormProps = {
  readonly id: Observable<number | null>
  readonly initItem: Observable<ItemFormValues | null>
  readonly onSave: (item: ItemFormValues) => void
  readonly onCancel: () => void
}

const ItemForm = ({
  id,
  initItem,
  onSave,
  onCancel,
}: ItemFormProps): TemplateContent => {
  const itemForm = {
    text: source<string>(initItem.current()?.text.current() ?? ""),
    checked: source<boolean>(initItem.current()?.checked.current() ?? false),
  }

  const handleClick = () => {
    onSave({
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
        computed(() => id.current()),
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
  items: ListSource<Item>
}): TemplateContent => {
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
          id={selectedId}
          initItem={selectedItem}
          onSave={(newItem) => {
            const index = items
              .current()
              .findIndex((item) => selectedId.current() === item.current().id)
            if (index >= 0) {
              const itemRef = items.current()[index].current()
              itemRef.checked.change(newItem.checked.current())
              itemRef.text.change(newItem.text.current())
            } else {
              items.insertItem(items.current().length, {
                id: selectedId.current() ?? idGenerator++,
                checked: newItem.checked,
                text: newItem.text,
                children: listSource<Item>([]),
              })
            }
          }}
          onCancel={() => {
            selectedId.change(null)
          }}
        />
      </div>
    </>
  )
}

const List = (): TemplateContent => {
  const items = listSource<Item>(
    ["One", "Two", "Three", "Four", "Five", "Six", "Seven"].map((text) => ({
      id: ++idGenerator,
      text: source<string>(text),
      checked: source<boolean>(false),
      children: listSource<Item>([]),
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
