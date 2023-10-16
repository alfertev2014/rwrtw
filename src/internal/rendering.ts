import { dce, setAttr, txt } from '../dom/helpers'
import { RenderedContent, RenderedElement } from '../template'
import { Lifecycle } from './lifecycle'
import { ListImpl } from './list'
import { ParentNodePlace, Place, renderNode } from './place'
import { PlaceholderImpl } from './placeholder'

const renderElement = (
    { tag, attrs, handlers, children }: RenderedElement,
    lifecycles: Lifecycle[],
): Place => {
    const element = dce(tag)

    processRendered(new ParentNodePlace(element), lifecycles, children)

    if (attrs) {
        for (const [name, value] of Object.entries(attrs)) {
            if (typeof value === 'function') {
                const lifecycle = value(element, name)
                if (lifecycle) {
                    lifecycles.push(lifecycle)
                }
            } else {
                setAttr(element, name, value)
            }
        }
    }
    for (const handler of handlers) {
        const lifecycle = handler(element)
        if (lifecycle) {
            lifecycles.push(lifecycle)
        }
    }
    return element
}

export const processRendered = (
    place: Place,
    lifecycles: Lifecycle[],
    rendered: RenderedContent,
): Place => {
    if (typeof rendered === 'boolean' || rendered === null || typeof rendered === 'undefined') {
        return place
    }
    if (typeof rendered === 'string') {
        place = renderNode(place, txt(rendered))
    } else if (typeof rendered === 'number') {
        place = renderNode(place, txt(rendered.toString()))
    } else if (Array.isArray(rendered)) {
        for (const r of rendered) {
            place = processRendered(place, lifecycles, r)
        }
    } else if (rendered.type === 'element') {
        place = renderElement(rendered, lifecycles)
    } else if (rendered.type === 'text') {
        place = renderNode(place, txt(rendered.data))
    } else if (rendered.type === 'placeholder') {
        const plh = new PlaceholderImpl(place, rendered.content)
        lifecycles.push(plh)
        rendered.handler?.(plh)
        place = plh
    } else if (rendered.type === 'list') {
        const list = new ListImpl(place, rendered.contents)
        lifecycles.push(list)
        rendered.handler?.(list)
        place = list
    } else if (rendered.type === 'component') {
        place = processRendered(place, lifecycles, rendered.factory(...rendered.args))
    } else if (rendered.type === 'lifecycle') {
        lifecycles.push(rendered)
    }
    return place
}
