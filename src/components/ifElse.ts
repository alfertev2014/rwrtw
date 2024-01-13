import { type PlaceholderComponent, type PlaceholderContent } from "../core/index.js"

export interface IfElse {
  condition: boolean
}

export const ifElse =
  (
    condition: boolean,
    trueBranch: PlaceholderContent,
    falseBranch: PlaceholderContent,
    handler?: (ifElse: IfElse) => void,
  ): PlaceholderComponent =>
  (place, context) => {
    const placeholder = context.createPlaceholderAt(place, condition ? trueBranch : falseBranch)

    let _value = condition
    handler?.({
      get condition() {
        return _value
      },
      set condition(value: boolean) {
        if (_value !== value) {
          placeholder.replaceContent(value ? trueBranch : falseBranch)
          _value = value
        }
      },
    })
    return placeholder
  }
