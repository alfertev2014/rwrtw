# Быстрый старт

Этот раздел поможет вам быстро начать работу с RWRTW. Мы рассмотрим установку, создание первого приложения и основные концепции.

## Установка

Для начала установите RWRTW в ваш проект:

```bash
npm install rwrtw
```

## Создание первого приложения

Создайте файл `index.tsx` с следующим содержимым:

```tsx
import {
  type TemplateContent,
  createRootDynamicNodeAt,
  fr,
  placeAtBeginningOf,
} from "rwrtw"
import "./style.css"

const App = (): TemplateContent => {
  return (
    <div class="app">
      <h1>Привет, RWRTW!</h1>
      <p>Это первое приложение на RWRTW</p>
    </div>
  )
}

const root = createRootDynamicNodeAt(
  placeAtBeginningOf(document.body),
  fr(<App />),
)
root.mount?.()
```

## Основные функции

### Создание корневого узла

Для создания приложения вам нужно создать корневой динамический узел:

```ts
const root = createRootDynamicNodeAt(
  placeAtBeginningOf(document.body),
  fr(<App />),
)
```

Функция `createRootDynamicNodeAt` принимает два параметра:
1. Место, куда будет вставлен компонент (`placeAtBeginningOf(document.body)`)
2. Фрагмент JSX-компонента (`fr(<App />)`)

### Создание компонентов

Компоненты в RWRTW создаются как функции, возвращающие `TemplateContent`:

```ts
const MyComponent = (): TemplateContent => {
  return (
    <div>
      <h1>Заголовок</h1>
      <p>Текст</p>
    </div>
  )
}
```

### JSX синтаксис

RWRTW использует стандартный JSX синтаксис:

- Атрибуты передаются через `class`, `id`, `style` и другие
- События обрабатываются через `on:` префикс (например, `on:click`)
- Условное отображение и списки создаются через обычные JS выражения

## Простой пример с состоянием

Вот пример компонента с реактивным состоянием:

```tsx
import { state, computed, type TemplateContent } from "rwrtw"

const Counter = (): TemplateContent => {
  const count = state(0)
  
  const doubleCount = computed(() => count.get() * 2)
  
  return (
    <div>
      <p>Счётчик: {count.get()}</p>
      <p>Двойной счётчик: {doubleCount.get()}</p>
      <button on:click={() => count.set(count.get() + 1)}>
        Увеличить
      </button>
    </div>
  )
}
```

## Следующие шаги

- Ознакомьтесь с [основными концепциями](concepts.md)
- Изучите [туториал по созданию приложения](tutorial.md)
- Просмотрите [справочник API](api-reference.md)