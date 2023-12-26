import { type PlaceholderContent } from "../placeholder"
import { ifElse } from "./ifElse"

export interface Hidable {
  hide: () => void
  show: () => void
  visible: boolean
}

export const hidable = (content: PlaceholderContent, handler?: (ref: Hidable) => void): PlaceholderContent =>
  ifElse(true, content, null, (ref) => {
    handler?.({
      get visible() {
        return ref.condition
      },

      set visible(value: boolean) {
        ref.condition = value
      },

      hide() {
        this.visible = false
      },

      show() {
        this.visible = true
      },
    })
  })
