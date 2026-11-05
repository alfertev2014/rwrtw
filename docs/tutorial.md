# Туториал: Создание приложения

В этом руководстве мы создадим простое приложение с использованием RWRTW, чтобы продемонстрировать основные концепции и возможности фреймворка.

## Шаг 1: Настройка проекта

Создайте новый проект и установите RWRTW:

```bash
mkdir my-rwrtw-app
cd my-rwrtw-app
npm init -y
npm install rwrtw
```

## Шаг 2: Создание базовой структуры

Создайте файл `index.html`:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Мое приложение на RWRTW</title>
</head>
<body>
    <div id="app"></div>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

Создайте файл `src/main.tsx`:

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
      <h1>Добро пожаловать в RWRTW</h1>
      <p>Это простое приложение на RWRTW</p>
    </div>
  )
}

const root = createRootDynamicNodeAt(
  placeAtBeginningOf(document.getElementById("app")!),
  fr(<App />),
)
root.mount?.()
```

## Шаг 3: Создание компонента с состоянием

Создайте файл `src/components/Counter.tsx`:

```tsx
import { state, computed, type TemplateContent } from "rwrtw"

export const Counter = (): TemplateContent => {
  const count = state(0)
  
  const doubleCount = computed(() => count.get() * 2)
  
  return (
    <div class="counter">
      <h2>Счётчик</h2>
      <p>Значение: {count.get()}</p>
      <p>Двойное значение: {doubleCount.get()}</p>
      <button on:click={() => count.set(count.get() + 1)}>
        Увеличить
      </button>
      <button on:click={() => count.set(0)}>
        Сбросить
      </button>
    </div>
  )
}
```

## Шаг 4: Использование компонента

Обновите файл `src/main.tsx`:

```tsx
import {
  type TemplateContent,
  createRootDynamicNodeAt,
  fr,
  placeAtBeginningOf,
} from "rwrtw"
import "./style.css"
import { Counter } from "./components/Counter.js"

const App = (): TemplateContent => {
  return (
    <div class="app">
      <h1>Мое приложение на RWRTW</h1>
      <Counter />
    </div>
  )
}

const root = createRootDynamicNodeAt(
  placeAtBeginningOf(document.getElementById("app")!),
  fr(<App />),
)
root.mount?.()
```

## Шаг 5: Создание компонента с условным рендерингом

Создайте файл `src/components/Toggle.tsx`:

```tsx
import { state, type TemplateContent } from "rwrtw"

export const Toggle = (): TemplateContent => {
  const isVisible = state(true)
  
  return (
    <div class="toggle">
      <h2>Переключатель</h2>
      <button on:click={() => isVisible.set(!isVisible.get())}>
        {isVisible.get() ? "Скрыть" : "Показать"}
      </button>
      {isVisible.get() && (
        <div class="content">
          <p>Это содержимое отображается по запросу</p>
        </div>
      )}
    </div>
  )
}
```

## Шаг 6: Добавление компонента с динамическим списком

Создайте файл `src/components/List.tsx`:

```tsx
import { state, type TemplateContent } from "rwrtw"

export const List = (): TemplateContent => {
  const items = state(["Элемент 1", "Элемент 2", "Элемент 3"])
  
  const addItem = () => {
    const newId = items.get().length + 1
    items.set([...items.get(), `Элемент ${newId}`])
  }
  
  const removeItem = (index: number) => {
    const newItems = [...items.get()]
    newItems.splice(index, 1)
    items.set(newItems)
  }
  
  return (
    <div class="list">
      <h2>Динамический список</h2>
      <ul>
        {items.get().map((item, index) => (
          <li key={index}>
            {item}
            <button on:click={() => removeItem(index)}>Удалить</button>
          </li>
        ))}
      </ul>
      <button on:click={addItem}>Добавить элемент</button>
    </div>
  )
}
```

## Шаг 7: Создание главного приложения

Обновите файл `src/main.tsx`:

```tsx
import {
  type TemplateContent,
  createRootDynamicNodeAt,
  fr,
  placeAtBeginningOf,
} from "rwrtw"
import "./style.css"
import { Counter } from "./components/Counter.js"
import { Toggle } from "./components/Toggle.js"
import { List } from "./components/List.js"

const App = (): TemplateContent => {
  return (
    <div class="app">
      <h1>Приложение на RWRTW</h1>
      <Counter />
      <Toggle />
      <List />
    </div>
  )
}

const root = createRootDynamicNodeAt(
  placeAtBeginningOf(document.getElementById("app")!),
  fr(<App />),
)
root.mount?.()
```

## Шаг 8: Добавление стилей

Создайте файл `src/style.css`:

```css
.app {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.counter, .toggle, .list {
  border: 1px solid #ccc;
  padding: 15px;
  margin: 10px 0;
  border-radius: 5px;
}

button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  margin: 5px;
  border-radius: 3px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}

.content {
  margin-top: 10px;
  padding: 10px;
  background-color: #f8f9fa;
}
```

## Шаг 9: Запуск приложения

Создайте `package.json` скрипты для запуска:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

## Расширенный пример: Компоненты с состоянием

Создайте более сложный компонент, демонстрирующий работу с формами:

```tsx
import { state, computed, type TemplateContent } from "rwrtw"

export const Form = (): TemplateContent => {
  const name = state("")
  const email = state("")
  
  const isFormValid = computed(() => 
    name.get().trim() !== "" && 
    email.get().includes("@")
  )
  
  const handleSubmit = (e: Event) => {
    e.preventDefault()
    if (isFormValid.get()) {
      alert(`Форма отправлена!\nИмя: ${name.get()}\nEmail: ${email.get()}`)
    }
  }
  
  return (
    <form class="form" on:submit={handleSubmit}>
      <h2>Форма регистрации</h2>
      <div>
        <label for="name">Имя:</label>
        <input 
          id="name"
          type="text" 
          value={name.get()} 
          on:input={(e) => name.set((e.target as HTMLInputElement).value)}
        />
      </div>
      
      <div>
        <label for="email">Email:</label>
        <input 
          id="email"
          type="email" 
          value={email.get()} 
          on:input={(e) => email.set((e.target as HTMLInputElement).value)}
        />
      </div>
      
      <button type="submit" disabled={!isFormValid.get()}>
        Отправить
      </button>
    </form>
  )
}
```

## Заключение

В этом руководстве мы создали простое приложение на RWRTW, которое демонстрирует:

1. Основные концепции фреймворка
2. Создание компонентов с состоянием
3. Работу с вычисляемыми значениями
4. Условный рендеринг
5. Динамические списки
6. Обработку событий
7. Работу с формами

Эти примеры показывают, как RWRTW помогает создавать реактивные пользовательские интерфейсы с минимальным количеством абстракций и высокой производительностью.

Для продолжения изучения рекомендуем ознакомиться с [справочником API](api-reference.md).