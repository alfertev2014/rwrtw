import { PlaceholderContent, type PlaceholderComponent } from "../core/index.js"
import { TemplateHandler } from "../template/types.js"
import { ifElse } from "./ifElse.js"

export interface Hidable {
  hide: () => void
  show: () => void
  visible: boolean
}

export const hidable = (
  content: PlaceholderContent,
  handler?: TemplateHandler<Hidable>,
): PlaceholderComponent =>
  ifElse(true, content, null, (ifElse, context) => {
    handler?.(
      {
        get visible() {
          return ifElse.condition
        },

        set visible(value: boolean) {
          ifElse.condition = value
        },

        hide() {
          this.visible = false
        },

        show() {
          this.visible = true
        },
      },
      context,
    )
  })
