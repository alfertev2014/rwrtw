import { setAttr, toText, txt } from "../dom/helpers.js"
import type { PlaceholderComponent, PlaceholderContent } from "../index.js"
import type { ListObservable, ListObserver } from "../reactive/list.js"
import {
  type Observable,
  ObservableScope,
  createScope,
  effect,
  isObservable,
} from "../reactive/observable.js"
import type { ReactiveData, ReactiveValue } from "../reactive/types.js"
import { fr } from "../template/index.js"
import type { TemplateContent, TemplateHandler } from "../template/types.js"
import type { ScalarData } from "../dom/types.js"

export const reCompute = <T extends ReactiveData>(
  trigger: ReactiveValue<T>,
  effectFunc: (value: T) => void,
  initFunc = effectFunc,
): void => {
  if (isObservable(trigger)) {
    initFunc(trigger.current())
    effect(trigger, effectFunc)
  } else {
    initFunc(trigger)
  }
}

export const reEffect =
  <T extends ReactiveData>(
    trigger: ReactiveValue<T>,
    effectFunc: (value: T) => void,
  ): PlaceholderContent =>
  () => {
    reCompute(trigger, effectFunc)
  }

export const reAttr =
  <T extends HTMLElement, V extends ScalarData>(
    name: string,
    value: ReactiveValue<V>,
  ): TemplateHandler<T> =>
  (element) => {
    reCompute(value, (value) => {
      setAttr(element, name, value)
    })
  }

export const reProp =
  <T extends HTMLElement>(
    name: string,
    value: ReactiveValue<ScalarData>,
  ): TemplateHandler<T> =>
  (element) => {
    reCompute(value, (value) => {
      ;(element as Record<string, unknown>)[name] = value
    })
  }

export const reClass =
  <T extends HTMLElement>(
    className: string,
    toggle: ReactiveValue<string | null | undefined | boolean>,
  ): TemplateHandler<T> =>
  (element) => {
    reCompute(toggle, (toggle) => {
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
  (element) => {
    reCompute(value, (value) => {
      if (value != null) {
        element.style.setProperty(styleName, value)
      } else {
        element.style.removeProperty(styleName)
      }
    })
  }

const contentInScope =
  (contentFunc: () => TemplateContent): PlaceholderComponent =>
  (renderer) => {
    const scope: ObservableScope = createScope()
    scope.runInScope(() => {
      fr(contentFunc())(renderer)
    })
    renderer.registerLifecycle({
      unmount() {
        scope.cleanup()
      },
    })
  }

export const reContent = <T extends ReactiveData>(
  trigger: ReactiveValue<T>,
  contentFunc: (value: T) => TemplateContent,
): TemplateContent => {
  if (isObservable(trigger)) {
    return (renderer) => {
      const placeholder = renderer.insertPlaceholder(
        contentInScope(() => contentFunc(trigger.current())),
      )
      effect(trigger, (value) => {
        placeholder.replaceContent(contentInScope(() => contentFunc(value)))
      })
    }
  } else {
    return contentFunc(trigger)
  }
}

export const reText = (
  value: ReactiveValue<ScalarData>,
): PlaceholderComponent => {
  if (isObservable(value)) {
    return (renderer) => {
      const t = renderer.insertNode(txt(value.current()))
      effect(value, (value) => {
        t.textContent = toText(value)
      })
    }
  } else {
    return (renderer) => {
      renderer.insertNode(txt(value))
    }
  }
}

export const reIf = (
  condition: ReactiveValue<boolean>,
  trueBranch: TemplateContent,
  falseBranch: TemplateContent,
): TemplateContent => {
  return reContent(condition, (value) => (value ? trueBranch : falseBranch))
}

export const reList = <T extends ReactiveData>(
  listModel: ListObservable<T>,
  elementComponentFunc: (value: Observable<T>) => TemplateContent,
): PlaceholderComponent => {
  return (renderer) => {
    const list = renderer.insertList(
      listModel
        .current()
        .map((item) => contentInScope(() => elementComponentFunc(item))),
    )
    const observer: ListObserver<T> = {
      onInsert(i, item) {
        list.insert(
          i,
          contentInScope(() => elementComponentFunc(item)),
        )
      },
      onMove(from, to) {
        list.moveFromTo(from, to)
      },
      onRemove(i) {
        list.removeAt(i)
      },
    }
    listModel.registerObserver(observer)
    renderer.registerLifecycle({
      dispose() {
        listModel.unregisterObserver(observer)
      },
    })
  }
}
