import { plh } from '../internal/placeholder'
import { cmpnt, RenderedContent } from '../template'

export interface IfElse {
    condition: boolean
}

export const ifElse = cmpnt(
    (
        condition: boolean,
        trueBranch: (() => RenderedContent) | null,
        falseBranch: (() => RenderedContent) | null,
        handler?: (ifElse: IfElse) => void
    ): RenderedContent => {
        return plh(condition ? trueBranch?.() : falseBranch?.(), (placeholder) => {
            let _value = condition
            handler?.({
                get condition() {
                    return _value
                },
                set condition(value: boolean) {
                    if (_value !== value) {
                        placeholder.setContent(value ? trueBranch?.() : falseBranch?.())
                        _value = value
                    }
                },
            })
        })
    }
)