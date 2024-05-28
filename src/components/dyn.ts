import { PlaceholderContent, type PlaceholderComponent } from "../index.js"
import { plh, type TemplateHandler } from "../template/index.js"

export interface Dynamic {
  refresh: () => void
}

export const dyn = (content: () => PlaceholderContent, handler?: TemplateHandler<Dynamic>): PlaceholderComponent => {
  return plh(content(), (placeholder, context) => {
    handler?.(
      {
        refresh() {
          placeholder.replaceContent(content())
        },
      },
      context,
    )
  })
}
