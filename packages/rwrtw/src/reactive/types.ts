import type { ScalarData } from "../dom/types.js"
import type { ListObservable, ListSource } from "./list.js"
import type { Observable, Source } from "./observable.js"

export type PlainData<Data> =
  | ScalarData
  | {
      readonly [key: string | number]: Data | PlainData<Data>
    }
  | readonly (Data | PlainData<Data>)[]

export type ReactiveData = PlainData<Observable | ListObservable>
export type ReactiveNode<Data extends ReactiveData = ReactiveData> =
  | PlainData<Data>
  | Observable<Data>
  | ListObservable<Data>

export type ReactiveValue<T extends ReactiveData> = Observable<T> | T

export type MutableReactiveData = PlainData<Source | ListSource>
export type MutableReactiveNode<Data extends MutableReactiveData = MutableReactiveData> =
  | PlainData<Data>
  | Source<Data>
  | ListSource<Data>

export type DeepReadonly<T> = {
	readonly [P in keyof T]: DeepReadonly<T[P]>;
};