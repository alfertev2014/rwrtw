import { type TemplateContent } from "rwrtw"

const Counter = (): TemplateContent => {
  let counter = 0

  const counterText = `The button pressed ${counter} times!`

  return (
    <div>
      <p class="paragraph">{counterText}</p>
      <button
        on:click={() => {
          counter++
        }}
      >
        Increment
      </button>
      <div>
        {counter % 2 === 0 ? <p class="even">Even!</p> : <p class="odd">Odd!</p>}
      </div>
    </div>
  )
}

export default Counter
