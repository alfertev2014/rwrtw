export interface Lifecycle {
    readonly mount?: () => void
    readonly unmount?: () => void
}

export class Lifecycles implements Lifecycle {
    lifecycles: Lifecycle[]
    constructor() {
        this.lifecycles = []
    }

    mount() {
        for (const c of this.lifecycles) {
            if (c.mount) {
                c.mount()
            }
        }
    }

    unmount() {
        for (const c of this.lifecycles) {
            if (c.unmount) {
                c.unmount()
            }
        }
        this.lifecycles.length = 0
    }

    addLifecycle(lifecycle: Lifecycle) {
        this.lifecycles.push(lifecycle)
    }
}
