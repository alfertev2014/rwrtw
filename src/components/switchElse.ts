import { type PlaceholderContent, type Placeholder, type PlaceholderComponent } from "../core/index.js"

export interface Switch<T> {
  value: T
}

export type CaseBranch<T> = [T, PlaceholderContent]

class SwitchImpl<T> implements Switch<T> {
  _value: T
  branches: Array<CaseBranch<T>>
  defaultBranch: PlaceholderContent
  readonly placeholder: Placeholder

  constructor(placeholder: Placeholder, value: T, branches: Array<CaseBranch<T>>, defaultBranch: PlaceholderContent) {
    this.placeholder = placeholder
    this._value = value
    this.branches = branches
    this.defaultBranch = defaultBranch
  }

  get value(): T {
    return this._value
  }

  set value(value: T) {
    if (this._value !== value) {
      this.placeholder.replaceContent(this._selectBranch())
      this._value = value
    }
  }

  _selectBranch(): PlaceholderContent {
    return selectBranch(this.value, this.branches, this.defaultBranch)
  }
}

const selectBranch = <T>(
  value: T,
  branches: Array<CaseBranch<T>>,
  defaultBranch: PlaceholderContent,
): PlaceholderContent => {
  for (const branch of branches) {
    if (value === branch[0]) {
      return branch[1]
    }
  }
  return defaultBranch
}

export const switchElse =
  <T>(
    value: T,
    branches: Array<CaseBranch<T>>,
    defaultBranch: PlaceholderContent,
    handler?: (sw: Switch<T>) => void,
  ): PlaceholderComponent =>
  (place, context) => {
    const placeholder = context.createPlaceholderAt(place, selectBranch(value, branches, defaultBranch))
    handler?.(new SwitchImpl<T>(placeholder, value, branches, defaultBranch))
    return placeholder
  }
