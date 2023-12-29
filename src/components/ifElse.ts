import { type PlaceholderContent } from "../core/index.js"

export interface IfElse {
  condition: boolean
}

export const ifElse =
  (
    condition: boolean,
    trueBranch: PlaceholderContent,
    falseBranch: PlaceholderContent,
    handler?: (ifElse: IfElse) => void,
  ): PlaceholderContent =>
  (context) => {
    const placeholder = context.renderPlaceholder(condition ? trueBranch : falseBranch)

    let _value = condition
    handler?.({
      get condition() {
        return _value
      },
      set condition(value: boolean) {
        if (_value !== value) {
          placeholder.setContent(condition ? trueBranch : falseBranch)
          _value = value
        }
      },
    })
  }
