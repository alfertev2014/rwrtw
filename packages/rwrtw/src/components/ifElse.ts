import type { PlaceholderContent, PlaceholderComponent } from "../core/index.js"
import { plh } from "../template/index.js"
import type { TemplateHandler } from "../template/types.js"

export interface IfElse {
  condition: boolean
}

export const ifElse = (
  initCondition: boolean,
  trueBranch: PlaceholderContent,
  falseBranch: PlaceholderContent,
  handler?: TemplateHandler<IfElse>,
): PlaceholderComponent =>
  plh(initCondition ? trueBranch : falseBranch, (placeholder, context) => {
    let _condition = initCondition
    handler?.(
      {
        get condition() {
          return _condition
        },
        set condition(value: boolean) {
          if (_condition !== value) {
            placeholder.replaceContent(value ? trueBranch : falseBranch)
            _condition = value
          }
        },
      },
      context,
    )
  })
