import { cmpnt, RenderedComponent, RenderedContent } from '../template'
import { ifElse } from './ifElse'

export interface Hidable {
    hide(): void
    show(): void
    visible: boolean
}

export const hidable = cmpnt(
    (content: () => RenderedContent, handler?: (ref: Hidable) => void): RenderedComponent =>
        ifElse(true, content, null, (ref) => {
            handler?.({
                get visible() {
                    return ref.condition
                },

                set visible(value: boolean) {
                    ref.condition = value
                },

                hide() {
                    this.visible = false
                },

                show() {
                    this.visible = true
                },
            })
        })
)
