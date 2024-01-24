import { type PlaceholderComponent } from "../index.js"
import { type TemplateContent, plh, type TemplateHandler, fr } from "../template/index.js"

export interface Dynamic {
  refresh: () => void
}

export const dyn = (content: () => TemplateContent, handler?: TemplateHandler<Dynamic>): PlaceholderComponent => {
  return plh(content(), (placeholder, context) => {
    handler?.(
      {
        refresh() {
          placeholder.replaceContent(fr(content()))
        },
      },
      context,
    )
  })
}
