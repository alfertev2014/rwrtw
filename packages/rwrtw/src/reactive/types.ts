import type { ScalarData } from "../dom/types.js"
import type { ListSignal, ListState } from "./list.js"
import type { Signal, State } from "./signal.js"

export type ReactiveSignal = Signal | ListSignal

export type ReactiveData =
  | ScalarData
  | {
      readonly [key: string | number]: ReactiveData | ReactiveSignal
    }
  | readonly (ReactiveData | ReactiveSignal)[]

export type ReadonlyReactiveOf<Data extends ReactiveData | ReactiveSignal> =
  Data extends ScalarData
    ? Data
    : Data extends State<infer Content extends ReactiveData>
      ? Signal<ReadonlyReactiveOf<Content>>
      : Data extends ListState<infer Content extends ReactiveData>
        ? ListSignal<ReadonlyReactiveOf<Content>>
        : Data extends {
              readonly [key: string | number]: infer Content extends
                ReactiveData
            }
          ? {
              readonly [key: string | number]: ReadonlyReactiveOf<Content>
            }
          : Data extends readonly (infer Content extends ReactiveData)[]
            ? ReadonlyReactiveOf<Content>[]
            : never

export type ReactiveValue<T extends ReactiveData> = Signal<T> | T

export type DeepReadonly<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>
}
