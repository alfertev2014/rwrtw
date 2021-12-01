import { el, ElementController } from './index'

const root = document.getElementById('root')
if (root) {
    let counter = 0
    let hello: HTMLElement
    el('div')(
        el('h1')(
            'It Works!'
        ),
        el('p', (p) => { hello = p; }, { attrs: { class: 'paragraph' } })(
            'HelloWorld!'
        ),
        el('button', {
            on: {
                click: (e) => {
                    hello.innerText = `Hello ${counter++}`
                }
            },
        })('Increment')
    ).render(root).mount()
}   
