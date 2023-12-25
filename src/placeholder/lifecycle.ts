export interface Lifecycle {
  readonly mount?: () => void
  readonly unmount?: () => void
  readonly dispose?: () => void
}
