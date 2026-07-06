import type { ScalarData } from "../dom/types.js"
import type { ListObservable, ListSource } from "./list.js"
import type { Observable, Source } from "./observable.js"

export type ReactiveObservable = Observable | ListObservable

export type ReactiveData =
  | ScalarData
  | ReactiveObservable
  | {
      readonly [key: string | number]: ReactiveData
    }
  | readonly ReactiveData[]

export type ReadonlyReactiveOf<Data extends ReactiveData> =
  Data extends ScalarData
    ? Data
    : Data extends Source<infer Content extends ReactiveData>
      ? Observable<ReadonlyReactiveOf<Content>>
      : Data extends ListSource<infer Content extends ReactiveData>
        ? ListObservable<ReadonlyReactiveOf<Content>>
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

export type ReactiveValue<T extends ReactiveData> = Observable<T> | T

export type DeepReadonly<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>
}
