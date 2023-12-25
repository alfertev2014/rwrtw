import { dce, setAttr, txt } from "../dom/helpers"
import { PlaceholderContent, RegLifecycleHandler, createPlaceholder } from "../placeholder"
import { ParentNodePlace, Place, renderNode } from "../placeholder/place"
import { RenderedContent, RenderedElement } from "."
import { createList } from "../list"

const renderElement = (
  { tag, attrs, handlers, children }: RenderedElement,
  regLifecycle: RegLifecycleHandler,
): Place => {
  const element = dce(tag)

  processRendered(new ParentNodePlace(element), regLifecycle, children)

  if (attrs) {
    for (const [name, value] of Object.entries(attrs)) {
      if (typeof value === "function") {
        const lifecycle = value(element, name)
        if (lifecycle) {
          regLifecycle(lifecycle)
        }
      } else {
        setAttr(element, name, value)
      }
    }
  }
  for (const handler of handlers) {
    const lifecycle = handler(element)
    if (lifecycle) {
      regLifecycle(lifecycle)
    }
  }
  return element
}

export const processRendered = (place: Place, regLifecycle: RegLifecycleHandler, rendered: RenderedContent): Place => {
  if (typeof rendered === "boolean" || rendered === null || typeof rendered === "undefined") {
    return place
  }
  if (typeof rendered === "string") {
    place = renderNode(place, txt(rendered))
  } else if (typeof rendered === "number") {
    place = renderNode(place, txt(rendered.toString()))
  } else if (Array.isArray(rendered)) {
    for (const r of rendered) {
      place = processRendered(place, regLifecycle, r)
    }
  } else if (rendered.type === "element") {
    place = renderElement(rendered, regLifecycle)
  } else if (rendered.type === "text") {
    place = renderNode(place, txt(rendered.data))
  } else if (rendered.type === "placeholder") {
    const plh = createPlaceholder(place, templateContent(rendered.content))
    regLifecycle(plh)
    rendered.handler?.(plh)
    place = plh
  } else if (rendered.type === "list") {
    const list = createList(
      place,
      rendered.contents.map((content) => templateContent(content)),
    )
    regLifecycle(list)
    rendered.handler?.(list)
    place = list
  } else if (rendered.type === "component") {
    place = processRendered(place, regLifecycle, rendered.factory(...rendered.args))
  } else if (rendered.type === "lifecycle") {
    regLifecycle(rendered)
  }
  return place
}

export const templateContent =
  (content: RenderedContent): PlaceholderContent =>
  (place, regLifecycle) => {
    return processRendered(place, regLifecycle, content)
  }
