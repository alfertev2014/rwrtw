import { el, TemplateRef, fr, ref, Component } from './index'

const root = document.getElementById('root')
if (root) {
    let counter = 0
    let hello: TemplateRef<Element>
    let even: Component
    let odd: Component
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
                    if (counter % 2 === 0) {
                        even.renderNodes()
                        odd.unrenderNodes()
                    } else {
                        even.unrenderNodes()
                        odd.renderNodes()
                    }
                }
            })('Increment'),
            el('div')(
                even = fr(el('p')("Even!")),
                odd = fr(el('p')("Odd!")),
            )
        )
    )
    app.attach(root)
    app.mount()
}   
