import { PlaceholderContent, type PlaceholderComponent } from "../index.js"
import { plh } from "../template/index.js"
import { TemplateHandler } from "../template/types.js"

export interface Dynamic {
  refresh: () => void
}

export const dyn = (
  content: () => PlaceholderContent,
  handler?: TemplateHandler<Dynamic>,
): PlaceholderComponent => {
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
