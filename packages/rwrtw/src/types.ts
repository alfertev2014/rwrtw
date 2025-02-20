import { ListObservable } from "./reactive/list.js"
import { Observable } from "./reactive/observable.js"

export type ScalarData = number | string | boolean | bigint | null | undefined

export type RecordData = {
  readonly [key: string | number]: PlainData
}

export type PlainData = ScalarData | RecordData | readonly PlainData[] | Observable<PlainData> | ListObservable<PlainData>
