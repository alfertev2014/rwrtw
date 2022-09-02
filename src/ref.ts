import { ComponentFactory, Renderer } from './internal/renderer'

export interface TemplateRef<T> {
    readonly current: T
    as(renderFunc: ComponentFactory<T>): ComponentFactory<T>
}

class TemplateRefImpl<T> implements TemplateRef<T> {
    _current: T | null = null
    get current(): T {
        if (!this._current) {
            throw Error('Invalid usage of TemplateRef')
        }
        return this._current
    }

    as(componentFunc: ComponentFactory<T>): ComponentFactory<T> {
        return (renderer: Renderer) => {
            const rendered = componentFunc(renderer)
            this._current = rendered
            return rendered
        }
    }
}

export const createRef = <T>() => new TemplateRefImpl<T>()
