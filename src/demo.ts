import { el, TemplateRef, fr, ref } from './index'

const root = document.getElementById('root')
if (root) {
    let counter = 0
    let hello: TemplateRef<Element>
    const app = fr(
        el('div')(
            el('h1')(
                'It Works!'
            ),
            hello = ref(el('p', { class: 'paragraph' }, null)(
                'Hello world!'
            )),
            el('button', null, {
                click: () => {
                    hello.element.textContent = `Hello world ${counter++} times!`
                }
            })('Increment')
        )
    )
    app.attach(root)
    app.mount()
}   
