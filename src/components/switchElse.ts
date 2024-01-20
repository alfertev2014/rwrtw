import { type PlaceholderComponent } from "../core/index.js"
import { fr, plh, type TemplateHandler, type TemplateContent } from "../template/index.js"

export interface Switch<T> {
  value: T
}

export type CaseBranch<T> = [T, TemplateContent]

const selectBranch = <T>(value: T, branches: Array<CaseBranch<T>>, defaultBranch: TemplateContent): TemplateContent => {
  for (const branch of branches) {
    if (value === branch[0]) {
      return branch[1]
    }
  }
  return defaultBranch
}

export const switchElse = <T>(
  initValue: T,
  branches: Array<CaseBranch<T>>,
  defaultBranch: TemplateContent,
  handler?: TemplateHandler<Switch<T>>,
): PlaceholderComponent =>
  plh(selectBranch(initValue, branches, defaultBranch), (placeholder, context) => {
    let _value: T = initValue
    handler?.(
      {
        get value(): T {
          return _value
        },
        set value(value: T) {
          if (_value !== value) {
            placeholder.replaceContent(fr(selectBranch(value, branches, defaultBranch)))
            _value = value
          }
        },
      },
      context,
    )
  })
