import { el } from './index'

const root = document.getElementById('root')
if (root) {
    el('div')(
        el('h1')(
            'It Works!'
        ),
        el('p', { class: 'paragraph'})(
            'HelloWorld!'
        )
    ).render(root)
}   
