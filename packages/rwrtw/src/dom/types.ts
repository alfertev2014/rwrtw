
export type ScalarData = number | string | boolean | bigint | null | undefined

export type TagToHTMLElement<T extends string> =
  T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : HTMLElement

  export type PropsOfElement<E extends HTMLElement> = {
  [K in keyof E as E[K] extends () => unknown ? never : K]: E[K]
}