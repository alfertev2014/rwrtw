import { PlaceholderComponent } from "src/core/index.js"
import { Observable, Source } from "src/reactive/observable.js"
import { el, on } from "src/template/index.js"
import { reProp } from "src/template/reactive.js"

export type TextInputProps = {
  value: Source<string>
}

export const TextInput = ({ value }: TextInputProps): PlaceholderComponent => {
  return el(
    "input",
    { type: "text" },
    reProp("value", value),
    on("change", (e) => {
      value.change((e.target as HTMLInputElement).value)
    }),
  )()
}

export type CheckboxInputProps = {
  checked: Source<boolean>
}

export const CheckboxInput = ({ checked }: CheckboxInputProps): PlaceholderComponent => {
  return el(
    "input",
    { type: "checkbox" },
    reProp("checked", checked),
    on("change", (e) => {
      checked.change((e.target as HTMLInputElement).checked)
    }),
  )()
}

