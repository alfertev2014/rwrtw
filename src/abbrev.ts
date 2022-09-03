import { el, ElementHandler, TemplateElementAttrsMap } from './template'

const abbrev =
    (tag: string) =>
    (attrs: TemplateElementAttrsMap | null = null, ...handlers: ElementHandler[]) =>
        el(tag, attrs, ...handlers)

export const p = abbrev('p')
export const a = abbrev('a')
export const article = abbrev('article')
export const aside = abbrev('aside')
export const br = abbrev('br')
export const button = abbrev('button')
export const div = abbrev('div')
export const em = abbrev('em')
export const footer = abbrev('footer')
export const form = abbrev('form')
export const header = abbrev('header')
export const h1 = abbrev('h1')
export const h2 = abbrev('h2')
export const h3 = abbrev('h3')
export const h4 = abbrev('h4')
export const h5 = abbrev('h5')
export const h6 = abbrev('h6')
export const hr = abbrev('hr')
export const img = abbrev('img')
export const input = abbrev('input')
export const label = abbrev('label')
export const li = abbrev('li')
export const main = abbrev('main')
export const nav = abbrev('nav')
export const ol = abbrev('ol')
export const option = abbrev('option')
export const pre = abbrev('pre')
export const section = abbrev('section')
export const select = abbrev('select')
export const span = abbrev('span')
export const style = abbrev('style')
export const summary = abbrev('summary')
export const table = abbrev('table')
export const tbody = abbrev('tbody')
export const td = abbrev('td')
export const textarea = abbrev('textarea')
export const tfoot = abbrev('tfoot')
export const th = abbrev('th')
export const thead = abbrev('thead')
export const tr = abbrev('tr')
export const ul = abbrev('ul')
