import type { TemplateContent } from "rwrtw"

export const C = ({ a, b }: { a: string, b: number}) => null

export const D = ({ e, children }: { e: boolean, children?: TemplateContent }) => null

const foo = "bar"

const list = ["foo", "bar", "baz"]

export const f = () => {
  return (
    <div on:click={e => { return undefined  }} p:prop={5}>
      sdfhsfgh
      {foo}
      <div>
        sfgh
        {list.map((s, i) => <C a={s} b={i} />)}
        <C a={""} b={0} />
        <C a={""} b={0} />
        <C a={""} b={0} />
        <C a={""} b={0} />
      </div>
      sfgh
    <D e>
      dfg
      <D e={false} />
    </D>

      <C a={""} b={0} />
    </div>
  )
}