import { Placeholder } from "../placeholder"
import { plh, cmpnt, RenderedContent } from "../template"
import { templateContent } from "../template/rendering"

export interface Switch<T> {
  value: T
}

export type CaseBranch<T> = [T, (() => RenderedContent) | null]

class SwitchImpl<T> implements Switch<T> {
  _value: T
  branches: CaseBranch<T>[]
  defaultBranch: (() => RenderedContent) | null
  readonly placeholder: Placeholder

  constructor(
    placeholder: Placeholder,
    value: T,
    branches: CaseBranch<T>[],
    defaultBranch: (() => RenderedContent) | null,
  ) {
    this.placeholder = placeholder
    this._value = value
    this.branches = branches
    this.defaultBranch = defaultBranch
  }

  get value() {
    return this._value
  }

  set value(value: T) {
    if (this._value !== value) {
      this.placeholder.setContent(templateContent(this._selectBranch()))
      this._value = value
    }
  }

  _selectBranch() {
    return selectBranch(this.value, this.branches, this.defaultBranch)
  }
}

const selectBranch = <T>(
  value: T,
  branches: CaseBranch<T>[],
  defaultBranch: (() => RenderedContent) | null,
): RenderedContent => {
  for (const branch of branches) {
    if (value === branch[0]) {
      return branch[1]?.()
    }
  }
  return defaultBranch?.()
}

export const switchElse = cmpnt(
  <T>(
    value: T,
    branches: CaseBranch<T>[],
    defaultBranch: (() => RenderedContent) | null = null,
    handler?: (sw: Switch<T>) => void,
  ): RenderedContent => {
    return plh(selectBranch(value, branches, defaultBranch), (placeholder: Placeholder) => {
      handler?.(new SwitchImpl<T>(placeholder, value, branches, defaultBranch))
    })
  },
)
