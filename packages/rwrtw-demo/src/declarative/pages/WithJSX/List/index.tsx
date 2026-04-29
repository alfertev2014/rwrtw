import {
  reEffect,
  type TemplateContent,
} from "rwrtw"

import "./style.css"

const TextInput = ({ value }: { value: string }): TemplateContent => {
  return (
    <input
      type="text"
      p:value={value}
      on:change={(e) => {
        value = (e.target as HTMLInputElement).value
      }}
    />
  )
}

const Checkbox = ({ value }: { value: boolean }): TemplateContent => {
  return (
    <input
      type="checkbox"
      p:checked={value}
      on:change={(e) => {
        value = (e.target as HTMLInputElement).checked
      }}
    />
  )
}

type Item = {
  readonly id: number
  checked: boolean
  text: string
}

let idGenerator = 0

type ItemFormProps = {
  readonly initItem: Item | null
  readonly onSave: (item: Readonly<Item>) => void
  readonly onCancel: () => void
}

const ItemForm = ({
  initItem,
  onSave,
  onCancel,
}: ItemFormProps): TemplateContent => {
  const itemForm: { text: string; checked: boolean } = {
    text: initItem?.text ?? "",
    checked: initItem?.checked ?? false
  };

  const handleClick = () => {
    onSave({
      id: initItem?.id ?? ++idGenerator,
      text: itemForm.text,
      checked: itemForm.checked,
    })
  }

  const id = initItem?.id

  return (
    <>
      {reEffect(initItem, (initValue) => {
        if (initValue) {
          itemForm.text = initValue.text
          itemForm.checked = initValue.checked
        } else {
          itemForm.text = ""
          itemForm.checked = false
        }
      })}
      {id ? <span>[{id}]</span> : null}
      <Checkbox value={itemForm.checked} />
      <TextInput value={itemForm.text} />
      <button on:click={handleClick}>Save</button>
      <button on:click={onCancel}>Cancel</button>
    </>
  )
}

const List = (): TemplateContent => {
  const items: Item[] = 
    ["One", "Two", "Three", "Four", "Five", "Six", "Seven"].map((text) => ({
      id: ++idGenerator,
      text,
      checked: false,
    }))

  let selectedId: number | null = null
  const selectedItem = items.find((item) => item.id === selectedId) ?? null
  
  const count = items.length
  const checkedCount = items.filter((item) => item.checked).length;

  return (
    <div class="list-container">
      <h1>Dynamic list</h1>
      <ol class="list-content">
        {items.map((item, index) => {
          const id = item.id
          return (
            <li
              class={`list-item ${selectedItem?.id === id ? "list-item-selected" : ""}`}
            >
              <span class="list-item-id">
                [{id}]
              </span>
              <span class="list-item-value">
                [{item.checked ? "x" : " "}] {item.text}
              </span>
              <span class="list-item-actions">
                <button
                  on:click={() => {
                    selectedId = id
                  }}
                  data-id={id}
                >
                  Edit
                </button>
                <button
                  on:click={() => {
                    items.moveItem(index, 0)
                  }}
                  data-id={id}
                >
                  ^
                </button>
                <button
                  on:click={() => {
                    items.moveItem(index, items.length - 1)
                  }}
                  data-id={id}
                >
                  v
                </button>

                <button
                  on:click={() => {
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
            {checkedCount} / {count}
          </span>
        </div>
      </ol>
      <div class="list-add-item-form">
        <ItemForm
          initItem={selectedItem}
          onSave={(newItem) => {
            const index = items
              .findIndex((item) => item.id === selectedItem?.id)
            if (index >= 0) {
              items[index] = newItem
            } else {
              items.push(newItem)
            }
          }}
          onCancel={() => {
            selectedId = null
          }}
        />
      </div>
    </div>
  )
}

export default List
