import { ComponentFactory, Renderer } from '../internal/renderer'

export interface IfElse {
    condition: boolean
}

export const ifElse =
    (
        condition: boolean,
        trueBranch: ComponentFactory | null,
        falseBranch: ComponentFactory | null
    ): ComponentFactory<IfElse> => {
    return (renderer: Renderer) => {
        let _value = condition
        
        const placeholder = renderer.renderPlaceholder(condition ? trueBranch : falseBranch)

        return {
            get condition() { return _value },
            set condition(value: boolean) {
                if (_value !== value) {
                    placeholder.setContent(value ? trueBranch : falseBranch)
                    _value = value
                }
            }
        }
    }
}
        
