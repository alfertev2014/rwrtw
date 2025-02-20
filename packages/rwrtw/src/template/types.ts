import { PlaceholderComponent, PlaceholderContext } from "../core/index.js"
import { ScalarData } from "../types.js"

export type TemplateHandler<T> = (
  element: T,
  context: PlaceholderContext,
) => void

export type TemplateElementAttrsConfig = {
  [key: string]: ScalarData
}

export type TemplateItem = ScalarData | PlaceholderComponent

export type TemplateContent = TemplateContent[] | TemplateItem
