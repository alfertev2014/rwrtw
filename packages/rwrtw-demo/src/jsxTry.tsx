
export const C = ({ a, b }: { a: string, b: number}) => null

export const f = () => {
  return (
    <div on:click={e => { return undefined  }} p:prop={5}>
      sdfhsfgh
      <div>
        sfgh
        <C a={""} b={0} />
      </div>
      sfgh
    </div>
  )
}