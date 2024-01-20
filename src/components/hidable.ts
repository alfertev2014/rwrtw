import { type PlaceholderComponent } from "../core/index.js"
import { type TemplateContent, type TemplateHandler } from "../template/index.js"
import { ifElse } from "./ifElse.js"

export interface Hidable {
  hide: () => void
  show: () => void
  visible: boolean
}

export const hidable = (content: TemplateContent, handler?: TemplateHandler<Hidable>): PlaceholderComponent =>
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
