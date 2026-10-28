import { computed, reIf, reText, state, type TemplateContent } from "rwrtw"

const Counter = (): TemplateContent => {
  const counter = state<number>(0)

  const counterText = computed(() => `Hello world ${counter.get()} times!`)

  return (
    <div>
      <h1>It Works!</h1>
      <p class="paragraph">{reText(counterText)}</p>
      <button
        on:click={() => {
          counter.update((prev) => prev + 1)
        }}
        on:focus={() => {
          console.log("Increment button is focused")
        }}
      >
        Increment
      </button>
      <div>
        {reIf(
          computed(() => counter.get() % 2 === 0),
          <p>Even!</p>,
          <p>Odd!</p>,
        )}
      </div>
    </div>
  )
}

export default Counter
