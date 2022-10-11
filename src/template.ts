import { Lifecycle } from './lifecycle'
import { ElementAttrValue } from './dom'
import { EventHandlerController, EventHandlersMap } from './events'
import { PlaceholderImpl } from './internal/placeholder'
import { ListImpl } from './internal/list'

export type RenderedType = 'element' | 'text' | 'placeholder' | 'component' | 'lifecycle'

export interface RenderedElement {
    type: 'element'
    tag: string
    attrs: TemplateElementAttrsMap | null
    handlers: ElementHandler[]
    children: RenderedContent
}

export interface RenderedText {
    type: 'text'
    data: string
    handler?: (node: Text) => Lifecycle | void
}

export interface RenderedPlaceholder {
    type: 'placeholder'
    content: RenderedContent
    handler?: (placeholder: PlaceholderImpl) => void
}

export interface RenderedList {
    type: 'list'
    contents: RenderedContent[]
    handler?: (list: ListImpl) => void
}

export interface RenderedComponent {
    type: 'component'
    factory: (...args: unknown[]) => RenderedContent
    args: unknown[]
}

export interface RenderedLifecycle extends Lifecycle {
    type: 'lifecycle'
}

export type Rendered =
    | RenderedElement
    | RenderedText
    | RenderedPlaceholder
    | RenderedList
    | RenderedComponent
    | RenderedLifecycle
    | string
    | number
    | boolean
    | null
    | undefined

export type RenderedContent = Rendered | RenderedContent[]

export type ElementHandler = (element: HTMLElement) => Lifecycle | void
export type AttributeHandler = (element: HTMLElement, attr: string) => Lifecycle | void

export interface TemplateElementAttrsMap {
    [key: string]: ElementAttrValue | AttributeHandler
}

export const on =
    (handlers: EventHandlersMap): ElementHandler =>
    (element) =>
        new EventHandlerController(element, handlers)

export const el =
    (tag: string, attrs: TemplateElementAttrsMap | null = null, ...handlers: ElementHandler[]) =>
    (...children: RenderedContent[]): RenderedElement => ({
        type: 'element',
        tag,
        attrs,
        handlers,
        children,
    })

export const text = (
    data: string,
    handler?: (node: Text) => Lifecycle | void
): RenderedText => ({
    type: 'text',
    data,
    handler,
})

export const cmpnt = <Func extends (...args: any[]) => RenderedContent>(factory: Func) =>
    (...args: Parameters<Func>): RenderedComponent => ({
        type: 'component',
        factory,
        args,
    })
