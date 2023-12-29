import { dce, setAttr, txt } from "../dom/helpers.js"
import { type PlaceholderContent, type PlaceholderContext } from "../core/index.js"
import { type RenderedContent, type RenderedElement } from "./index.js"

const renderElement = ({ tag, attrs, handlers, children }: RenderedElement, context: PlaceholderContext): void => {
  const element = dce(tag)

  processRendered(context.createChildContextIn(element), children)

  if (attrs != null) {
    for (const [name, value] of Object.entries(attrs)) {
      if (typeof value === "function") {
        const lifecycle = value(element, name)
        if (lifecycle != null) {
          context.regLifecycle(lifecycle)
        }
      } else {
        setAttr(element, name, value)
      }
    }
  }
  for (const handler of handlers) {
    const lifecycle = handler(element)
    if (lifecycle != null) {
      context.regLifecycle(lifecycle)
    }
  }
}

export const processRendered = (context: PlaceholderContext, rendered: RenderedContent): void => {
  if (typeof rendered === "boolean" || rendered === null || typeof rendered === "undefined") {
    return
  }
  if (typeof rendered === "string") {
    context.renderNode(txt(rendered))
  } else if (typeof rendered === "number") {
    context.renderNode(txt(rendered.toString()))
  } else if (Array.isArray(rendered)) {
    for (const r of rendered) {
      processRendered(context, r)
    }
  } else if (rendered.type === "element") {
    renderElement(rendered, context)
  } else if (rendered.type === "text") {
    context.renderNode(txt(rendered.data))
  } else if (rendered.type === "placeholder") {
    const plh = context.renderPlaceholder(templateContent(rendered.content))
    rendered.handler?.(plh)
  } else if (rendered.type === "list") {
    const list = context.renderList(rendered.contents.map((content) => templateContent(content)))
    rendered.handler?.(list)
  } else if (rendered.type === "component") {
    processRendered(context, rendered.factory(...rendered.args))
  } else if (rendered.type === "lifecycle") {
    context.regLifecycle(rendered)
  }
}

export const templateContent =
  (content: RenderedContent): PlaceholderContent =>
  (context) => {
    processRendered(context, content)
  }
