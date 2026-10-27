import type { RenderableComponent, RenderingContext } from "../core/index.js"
import type { ScalarData } from "../dom/types.js"

export type TemplateHandler<T> = (
  element: T,
  context: RenderingContext,
) => void

export type TemplateElementAttrsConfig = {
  [key: string]: ScalarData
}

export type TemplateItem = ScalarData | RenderableComponent

export type TemplateContent = TemplateContent[] | TemplateItem
