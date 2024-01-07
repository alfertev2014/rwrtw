import { dce, setAttr, txt } from "../dom/helpers.js"
import { type PlaceholderContent, type PlaceholderContext } from "../core/index.js"
import { type RenderedContent, type RenderedElement } from "./index.js"

const renderElement = ({ tag, attrs, handlers, children }: RenderedElement, context: PlaceholderContext): void => {
  const element = dce(tag)

  processRendered(context.createContextIn(element), children)

  if (attrs != null) {
    for (const [name, value] of Object.entries(attrs)) {
      if (typeof value === "function") {
        const lifecycle = value(element, name)
        if (lifecycle != null) {
          context.appendLifecycle(lifecycle)
        }
      } else {
        setAttr(element, name, value)
      }
    }
  }
  for (const handler of handlers) {
    const lifecycle = handler(element)
    if (lifecycle != null) {
      context.appendLifecycle(lifecycle)
    }
  }
}

export const templateContent =
  (content: RenderedContent): PlaceholderContent =>
  (context) => {
    processRendered(context, content)
  }


const processRendered = (context: PlaceholderContext, rendered: RenderedContent): void => {
  if (typeof rendered === "boolean" || rendered === null || typeof rendered === "undefined") {
    return
  }
  if (typeof rendered === "string") {
    context.appendNode(txt(rendered))
  } else if (typeof rendered === "number") {
    context.appendNode(txt(rendered.toString()))
  } else if (Array.isArray(rendered)) {
    for (const r of rendered) {
      processRendered(context, r)
    }
  } else if (rendered.type === "element") {
    renderElement(rendered, context)
  } else if (rendered.type === "text") {
    context.appendNode(txt(rendered.data))
  } else if (rendered.type === "placeholder") {
    const plh = context.appendPlaceholder(templateContent(rendered.content))
    rendered.handler?.(plh)
  } else if (rendered.type === "list") {
    const list = context.appendList(rendered.contents.map((content) => templateContent(content)))
    rendered.handler?.(list)
  } else if (rendered.type === "component") {
    rendered.factory(...rendered.args)?.(context)
  } else if (rendered.type === "lifecycle") {
    context.appendLifecycle(rendered)
  }
}

