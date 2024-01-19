import { type PlaceholderComponent } from "../core/index.js"
import { type TemplateContent, type TemplateHandler } from "../template/index.js"
import { ifElse } from "./ifElse.js"

export interface Hidable {
  hide: () => void
  show: () => void
  visible: boolean
}

export const hidable = (content: TemplateContent, handler?: TemplateHandler<Hidable>): PlaceholderComponent =>
  ifElse(true, content, null, (ref, context) => {
    handler?.(
      {
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
      },
      context,
    )
  })
