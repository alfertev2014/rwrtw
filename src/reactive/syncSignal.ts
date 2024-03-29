export type SignalHandler<T> = (value: T) => void

export type UnsubscribeCallback = () => void

export interface SyncSignal<T> {
  subscribe: (handler: SignalHandler<T>) => UnsubscribeCallback
  unsubscribe: (handler: SignalHandler<T>) => void
  emit: (value: T) => void
}

export const createSyncSignal = <T>(): SyncSignal<T> => {
  const handlers: Array<(value: T) => void> = []
  return {
    subscribe(handler) {
      handlers.push(handler)
      return () => {
        this.unsubscribe(handler)
      }
    },
    unsubscribe(handler) {
      for (let index = handlers.indexOf(handler); index >= 0; index = handlers.indexOf(handler)) {
        handlers.splice(index, 1)
      }
    },
    emit(value) {
      for (const handler of handlers) {
        handler(value)
      }
    },
  }
}
