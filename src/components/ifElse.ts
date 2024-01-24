import { type PlaceholderComponent } from "../core/index.js"
import { type TemplateContent, fr, type TemplateHandler, plh } from "../template/index.js"

export interface IfElse {
  condition: boolean
}

export const ifElse = (
  initCondition: boolean,
  trueBranch: TemplateContent,
  falseBranch: TemplateContent,
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
            placeholder.replaceContent(fr(value ? trueBranch : falseBranch))
            _condition = value
          }
        },
      },
      context,
    )
  })
