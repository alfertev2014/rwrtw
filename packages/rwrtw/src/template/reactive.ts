import { setAttr } from "../dom/helpers.js"
import { type PlaceholderContext, type PlaceholderComponent, PlaceholderContent } from "../index.js"
import { ListObservable } from "../reactive/list.js"
import { type Observable, computed, effect } from "../reactive/observable.js"
import { PlainData, ScalarData } from "../types.js"
import {
  plhList,
  plh,
  type TemplateElementAttrHandler,
  TemplateHandler,
  attr,
  prop,
} from "./index.js"

export const reCompute = <T extends PlainData>(
  context: PlaceholderContext,
  trigger: Observable<T>,
  sideEffectFunc: (value: T) => void,
): void => {
  const eff = effect(trigger, sideEffectFunc)
  context.registerLifecycle({
    dispose() {
      eff.unsubscribe()
    },
  })
}

export const reAttr =
  <T extends HTMLElement>(name: string, trigger: Observable<ScalarData>): TemplateHandler<T> =>
  (element, context) => {
    reCompute(context, trigger, (value) => {
      setAttr(element, name, value)
    })
  }

export const reProp =
  <T extends HTMLElement, N extends keyof T>(
    name: N,
    trigger: T[N] extends PlainData ? Observable<T[N]> : never,
  ): TemplateHandler<T> =>
  (element, context) => {
    reCompute(context, trigger, (value) => {
      element[name] = value
    })
  }

export const reAt =
  (trigger: Observable<ScalarData>): TemplateElementAttrHandler =>
  (element, attrName, context) => {
    setAttr(element, attrName, trigger.current())
    reCompute(context, trigger, (value) => {
      setAttr(element, attrName, value)
    })
  }

export const reEv =
  <T extends PlainData>(
    trigger: Observable<T>,
    listenerFactory: (value: T) => EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): TemplateElementAttrHandler =>
  (element, eventName, context) => {
    let listener = listenerFactory(trigger.current())
    element.addEventListener(eventName, listener, options)
    reCompute(context, trigger, (value) => {
      element.removeEventListener(eventName, listener)
      listener = listenerFactory(value)
      element.addEventListener(eventName, listener, options)
      context.registerLifecycle({
        dispose() {
          element.removeEventListener(eventName, listener, options)
        },
      })
    })
  }

export const reContent = <T extends PlainData>(
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

export const reList = <T extends PlainData>(
  listModel: ListObservable<T>,
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
