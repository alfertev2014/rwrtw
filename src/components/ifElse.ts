import { type PlaceholderContent, createPlaceholder } from "../core/index.js"

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
  (place, regLifecycle) => {
    const placeholder = createPlaceholder(place, condition ? trueBranch : falseBranch)
    regLifecycle(placeholder)

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
    return placeholder
  }
