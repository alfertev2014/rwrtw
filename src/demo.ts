import { el, Placeholder, plh } from './index'

const root = document.getElementById('root')
if (root) {
    let counter = 0
    let helloText: Placeholder
    const app = plh(
        el('div')(
            el('h1')(
                'It Works!'
            ),
            el('p', { class: 'paragraph' })(
                helloText = plh('Hello world!')
            ),
            el('button', null, {
                click: () => {
                    helloText.setContent(`Hello world ${counter++} times!`)
                }
            })('Increment')
        )
    )
    app.render(root)
    app.mount()
}   
