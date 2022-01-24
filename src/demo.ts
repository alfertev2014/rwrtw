import { el, TemplateRef, fr, ref, Component, createRef, renderTemplate } from './index'

const root = document.getElementById('root')
if (root) {
    let counter = 0
    let hello = createRef<Element>()
    let even = createRef<Component>()
    let odd = createRef<Component>()
    const app = renderTemplate(root,
        fr(
            el('div')(
                el('h1')(
                    'It Works!'
                ),
                ref(hello, el('p', { class: 'paragraph' }, null)(
                    'Hello world!'
                )),
                el('button', null, {
                    click: () => {
                        hello.current.textContent = `Hello world ${counter++} times!`
                        if (counter % 2 === 0) {
                            even.current.show()
                            odd.current.hide()
                        } else {
                            even.current.hide()
                            odd.current.show()
                        }
                    }
                })('Increment'),
                el('div')(
                    ref(even, fr(el('p')("Even!"))),
                    ref(odd, fr(el('p')("Odd!"))),
                )
            )
        )
    )
}   
