import { setAttr, toText, txt } from "../dom/helpers.js"
import type {
  PlaceholderContext,
  PlaceholderComponent,
  PlaceholderContent,
} from "../index.js"
import type { ListObservable } from "../reactive/list.js"
import {
  type Observable,
  effect,
  isObservable,
} from "../reactive/observable.js"
import type { PlainData, ScalarData } from "../types.js"
import { plhList, plh } from "../template/index.js"
import type { TemplateHandler } from "../template/types.js"

export type ReactiveValue<T extends PlainData> = Observable<T> | T

/**
 * Get current() of value if value is Observable. Returns value as is otherwise.
 * @param value Plain value or Observable node.
 * @returns Current value of Observable or value as is.
 */
export const currentOf = <T extends PlainData>(value: ReactiveValue<T>): T =>
  isObservable(value) ? value.current() : value

export const reCompute = <T extends PlainData>(
  context: PlaceholderContext,
  trigger: ReactiveValue<T>,
  effectFunc: (value: T) => void,
): void => {
  if (isObservable(trigger)) {
    effectFunc(trigger.current())
    const eff = effect(trigger, effectFunc)
    context.registerLifecycle({
      dispose() {
        eff.unsubscribe()
      },
    })
  } else {
    effectFunc(trigger)
  }
}

export const reEffect =
  <T extends PlainData>(
    trigger: ReactiveValue<T>,
    effectFunc: (value: T) => void,
  ): PlaceholderContent =>
  (renderer) => {
    reCompute(renderer.context, trigger, effectFunc)
  }

export const reAttr =
  <T extends HTMLElement, V extends ScalarData>(
    name: string,
    value: ReactiveValue<V>,
  ): TemplateHandler<T> =>
  (element, context) => {
    reCompute(context, value, (value) => {
      setAttr(element, name, value)
    })
  }

export const reProp =
  <T extends HTMLElement, N extends keyof T>(
    name: N,
    value: T[N] extends ScalarData ? ReactiveValue<T[N]> : never,
  ): TemplateHandler<T> =>
  (element, context) => {
    reCompute(context, value, (value) => {
      element[name] = value
    })
  }

export const reClass =
  <T extends HTMLElement>(
    className: string,
    toggle: ReactiveValue<string | null | undefined | boolean>,
  ): TemplateHandler<T> =>
  (element, context) => {
    reCompute(context, toggle, (toggle) => {
      if (toggle) {
        element.classList.add(className)
      } else {
        element.classList.remove(className)
      }
    })
  }

export const reStyle =
  <T extends HTMLElement>(
    styleName: string,
    value: ReactiveValue<string | null | undefined>,
  ): TemplateHandler<T> =>
  (element, context) => {
    reCompute(context, value, (value) => {
      if (value != null) {
        element.style.setProperty(styleName, value)
      } else {
        element.style.removeProperty(styleName)
      }
    })
  }

export const reContent = <T extends PlainData>(
  trigger: ReactiveValue<T>,
  contentFunc: (value: T) => PlaceholderContent,
): PlaceholderContent => {
  if (isObservable(trigger)) {
    return plh(contentFunc(trigger.current()), (placeholder, context) => {
      reCompute(context, trigger, (value) => {
        placeholder.replaceContent(contentFunc(value))
      })
    })
  } else {
    return contentFunc(trigger)
  }
}

export const reText = (
  value: ReactiveValue<ScalarData>,
): PlaceholderComponent => {
  if (isObservable(value)) {
    const content = value.current()
    return (renderer) => {
      const t = txt(content)
      reCompute(renderer.context, value, (value) => {
        t.textContent = toText(value)
      })
      renderer.insertNode(t)
    }
  } else {
    return (renderer) => renderer.insertNode(txt(value))
  }
}

export const reIf = (
  condition: ReactiveValue<boolean>,
  trueBranch: PlaceholderContent,
  falseBranch: PlaceholderContent,
): PlaceholderContent => {
  return reContent(condition, (value) => (value ? trueBranch : falseBranch))
}

export const reList = <T extends PlainData>(
  listModel: ListObservable<T>,
  elementComponentFunc: (value: Observable<T>) => PlaceholderContent,
): PlaceholderComponent => {
  return plhList(
    listModel.current().map((item) => elementComponentFunc(item)),
    (plhList, context) => {
      // TODO: multiple observers
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
