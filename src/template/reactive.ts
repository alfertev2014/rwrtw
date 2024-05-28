import { type ScalarValue, setAttr } from "../dom/helpers.js"
import { type PlaceholderContext, type PlaceholderComponent, PlaceholderContent } from "../index.js"
import { ListModel } from "../reactive/listModel.js"
import { type Observable, effect } from "../reactive/observable.js"
import { plhList, plh, type TemplateElementAttrHandler } from "./index.js"

export const reCompute = <T>(
  context: PlaceholderContext,
  observable: Observable<T>,
  sideEffectFunc: (value: T) => void,
): void => {
  const eff = effect(observable, sideEffectFunc)
  context.registerLifecycle({
    dispose() {
      eff.unsubscribe()
    },
  })
}

export const reAttr =
  (observable: Observable<ScalarValue>): TemplateElementAttrHandler =>
  (element, context, attrName) => {
    reCompute(context, observable, (value) => {
      setAttr(element, attrName, value)
    })
  }

export const reContent = <T>(
  trigger: Observable<T>,
  contentFunc: (value: T) => PlaceholderContent,
): PlaceholderComponent => {
  return plh(contentFunc(trigger.current()), (placeholder, context) => {
    reCompute(context, trigger, (value) => {
      placeholder.replaceContent(contentFunc(value))
    })
  })
}

export const reIf = (
  condition: Observable<boolean>,
  trueBranch: PlaceholderContent,
  falseBranch: PlaceholderContent,
): PlaceholderComponent => {
  return reContent(condition, (value) => (value ? trueBranch : falseBranch))
}

export const reList = <T>(
  listModel: ListModel<T>,
  elementComponentFunc: (value: Observable<T>) => PlaceholderComponent,
): PlaceholderComponent => {
  return plhList(
    listModel.data.map((item) => elementComponentFunc(item)),
    (plhList, context) => {
      listModel.observer = {
        onInsert(i, element) {
          plhList.insert(i, elementComponentFunc(element))
        },
        onMove(from, to) {
          plhList.moveFromTo(from, to)
        },
        onRemove(i) {
          plhList.removeAt(i)
        },
      }
      context.registerLifecycle({
        dispose() {
          listModel.observer = null
        },
      })
    },
  )
}
