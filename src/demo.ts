import { el, plh } from './index'

const root = document.getElementById('root')
if (root) {
    let counter = 0
    let hello: HTMLElement
    plh(root).setContent(
        el('div')(
            el('h1')(
                'It Works!'
            ),
            el('p', (p) => { hello = p; }, { attrs: { class: 'paragraph' } })(
                'Hello world!'
            ),
            el('button', {
                on: {
                    click: () => {
                        hello.innerText = `Hello world ${counter++} times!`
                    }
                },
            })('Increment')
        )
    )
}   
