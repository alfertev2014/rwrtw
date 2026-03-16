import type { ScalarData } from "../dom/types.js"
import type { ListObservable, ListSource } from "./list.js"
import type { Observable, Source } from "./observable.js"

export type PlainData<Data> =
  | ScalarData
  | {
      readonly [key: string | number]: Data | PlainData<Data>
    }
  | readonly (Data | PlainData<Data>)[]

export type ReactivePlainData = PlainData<Observable | ListObservable>
export type ReactiveNode =
  | PlainData<ReactivePlainData>
  | Observable
  | ListObservable

export type ReactiveValue<T extends ReactivePlainData> = Observable<T> | T

export type MutableReactivePlainData = PlainData<Source | ListSource>
export type MutableReactiveNode =
  | PlainData<Source | ListSource>
  | Source
  | ListSource
