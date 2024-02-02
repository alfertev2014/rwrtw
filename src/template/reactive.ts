import { type ScalarValue, setAttr } from "../dom/helpers.js";
import { ifElse, type PlaceholderContext, type PlaceholderComponent } from "../index.js";
import { type Observable, effect } from "../reactive/observable.js";
import { fr, plh, type TemplateContent, type TemplateElementAttrHandler } from "./index.js";


export const reCompute = <T>(context: PlaceholderContext, observable: Observable<T>, sideEffectFunc: (value: T) => void): void => {
  const eff = effect(observable, sideEffectFunc)
  context.registerLifecycle({
    dispose() {
      eff.unsubscribe()
    }
  })
}

export const reAttr = (observable: Observable<ScalarValue>): TemplateElementAttrHandler =>
  (element, context, attrName) => {
    reCompute(context, observable, (value) => {
      setAttr(element, attrName, value)
    })
  }

export const reIf = (condition: Observable<boolean>, trueBranch: TemplateContent, falseBranch: TemplateContent): PlaceholderComponent => {
  return ifElse(condition.current(), trueBranch, falseBranch, (ifElse, context) => {
    reCompute(context, condition, (value) => {
      ifElse.condition = value
    })
  })
}

export const reContent = <T>(trigger: Observable<T>, contentFunc: (value: T) => TemplateContent): PlaceholderComponent => {
  return plh(contentFunc(trigger.current()), (placeholder, context) => {
    reCompute(context, trigger, (value) => {
      placeholder.replaceContent(fr(contentFunc(value)))
    })
  })
}