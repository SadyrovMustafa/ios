# 🔌 REST API Documentation

## 📋 Обзор

TickTick REST API позволяет интегрировать приложение с внешними системами. API использует API ключи для аутентификации и поддерживает все основные операции с задачами, списками и проектами.

**Base URL:** `https://your-domain.com/api/v1`

**Версия:** 1.0.0

---

## 🔐 Аутентификация

Все запросы к API требуют API ключ в заголовке:

```
X-API-Key: tt_1234567890_abcdefghijklmnop
```

Или через Authorization header:

```
Authorization: Bearer tt_1234567890_abcdefghijklmnop
```

### Создание API ключа

1. Откройте приложение
2. Sidebar → "🔌 API Management"
3. Нажмите "+ Создать API ключ"
4. Введите название и выберите права доступа
5. **Сохраните ключ** - он больше не будет показан!

---

## 📊 Rate Limiting

По умолчанию: **1000 запросов в час** на один API ключ.

При превышении лимита возвращается статус `429 Too Many Requests`.

---

## 🎯 Endpoints

### Health Check

**GET** `/health` или `/`

Проверка работоспособности API.

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

---

### Tasks (Задачи)

#### Получить все задачи

**GET** `/tasks`

**Query параметры:**
- `listId` - фильтр по списку
- `priority` - фильтр по приоритету (none, low, medium, high)
- `completed` - фильтр по статусу (true/false)
- `tag` - фильтр по тегу
- `search` - поиск по названию/заметкам
- `page` - номер страницы (по умолчанию: 1)
- `limit` - количество на странице (по умолчанию: 50)

**Пример:**
```bash
GET /api/v1/tasks?completed=false&priority=high&page=1&limit=20
```

**Response:**
```json
[
  {
    "id": "task-123",
    "title": "Завершить проект",
    "notes": "Важные детали",
    "isCompleted": false,
    "dueDate": "2024-01-15T10:00:00.000Z",
    "priority": "high",
    "listId": "list-456",
    "tags": ["важно", "срочно"],
    "createdAt": "2024-01-01T10:00:00.000Z"
  }
]
```

---

#### Получить задачу по ID

**GET** `/tasks/:id`

**Пример:**
```bash
GET /api/v1/tasks/task-123
```

**Response:**
```json
{
  "id": "task-123",
  "title": "Завершить проект",
  "notes": "Важные детали",
  "isCompleted": false,
  "dueDate": "2024-01-15T10:00:00.000Z",
  "priority": "high",
  "listId": "list-456",
  "tags": ["важно", "срочно"],
  "createdAt": "2024-01-01T10:00:00.000Z"
}
```

---

#### Создать задачу

**POST** `/tasks`

**Требуемые права:** `tasks:write`

**Body:**
```json
{
  "title": "Новая задача",
  "notes": "Описание задачи",
  "dueDate": "2024-01-15T10:00:00.000Z",
  "priority": "high",
  "listId": "list-456",
  "tags": ["важно"]
}
```

**Response:** `201 Created`
```json
{
  "id": "task-789",
  "title": "Новая задача",
  ...
}
```

---

#### Обновить задачу

**PUT** или **PATCH** `/tasks/:id`

**Требуемые права:** `tasks:write`

**Body:**
```json
{
  "title": "Обновленное название",
  "isCompleted": true,
  "priority": "medium"
}
```

**Response:** `200 OK`

---

#### Удалить задачу

**DELETE** `/tasks/:id`

**Требуемые права:** `tasks:delete`

**Response:** `204 No Content`

---

### Lists (Списки)

#### Получить все списки

**GET** `/lists`

**Требуемые права:** `lists:read`

**Response:**
```json
[
  {
    "id": "list-456",
    "name": "Работа",
    "color": "#007AFF",
    "icon": "📋"
  }
]
```

---

#### Получить список по ID

**GET** `/lists/:id`

**Требуемые права:** `lists:read`

---

#### Создать список

**POST** `/lists`

**Требуемые права:** `lists:write`

**Body:**
```json
{
  "name": "Новый список",
  "color": "#007AFF",
  "icon": "📋"
}
```

---

#### Обновить список

**PUT** или **PATCH** `/lists/:id`

**Требуемые права:** `lists:write`

---

#### Удалить список

**DELETE** `/lists/:id`

**Требуемые права:** `lists:delete`

---

### Projects (Проекты)

#### Получить все проекты

**GET** `/projects`

**Требуемые права:** `projects:read`

**Response:**
```json
[
  {
    "id": "project-123",
    "name": "Веб-сайт",
    "description": "Разработка веб-сайта",
    "color": "#007AFF",
    "icon": "📁",
    "ownerId": "user-456",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "lists": ["list-1", "list-2"]
  }
]
```

---

#### Получить проект по ID

**GET** `/projects/:id`

**Требуемые права:** `projects:read`

---

#### Создать проект

**POST** `/projects`

**Требуемые права:** `projects:write`

**Body:**
```json
{
  "name": "Новый проект",
  "description": "Описание проекта",
  "color": "#007AFF",
  "icon": "📁"
}
```

---

### Users (Пользователи)

#### Получить всех пользователей

**GET** `/users`

**Требуемые права:** `users:read`

**Response:**
```json
[
  {
    "id": "user-123",
    "name": "Иван Иванов",
    "email": "ivan@example.com"
  }
]
```

---

#### Получить пользователя по ID

**GET** `/users/:id`

**Требуемые права:** `users:read`

---

## 📝 Примеры использования

### JavaScript/TypeScript

```typescript
import { APIRouter } from './services/APIRouter'

const api = APIRouter.createAPIClient('tt_1234567890_abcdefghijklmnop')

// Получить все задачи
const tasks = await api.get('/tasks', { completed: 'false' })

// Создать задачу
const newTask = await api.post('/tasks', {
  title: 'Новая задача',
  priority: 'high',
  listId: 'list-123'
})

// Обновить задачу
await api.patch('/tasks/task-123', {
  isCompleted: true
})

// Удалить задачу
await api.delete('/tasks/task-123')
```

---

### cURL

```bash
# Получить все задачи
curl -X GET "https://your-domain.com/api/v1/tasks" \
  -H "X-API-Key: tt_1234567890_abcdefghijklmnop"

# Создать задачу
curl -X POST "https://your-domain.com/api/v1/tasks" \
  -H "X-API-Key: tt_1234567890_abcdefghijklmnop" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Новая задача",
    "priority": "high",
    "listId": "list-123"
  }'

# Обновить задачу
curl -X PATCH "https://your-domain.com/api/v1/tasks/task-123" \
  -H "X-API-Key: tt_1234567890_abcdefghijklmnop" \
  -H "Content-Type: application/json" \
  -d '{
    "isCompleted": true
  }'
```

---

### Python

```python
import requests

API_KEY = "tt_1234567890_abcdefghijklmnop"
BASE_URL = "https://your-domain.com/api/v1"

headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

# Получить все задачи
response = requests.get(f"{BASE_URL}/tasks", headers=headers)
tasks = response.json()

# Создать задачу
new_task = {
    "title": "Новая задача",
    "priority": "high",
    "listId": "list-123"
}
response = requests.post(f"{BASE_URL}/tasks", json=new_task, headers=headers)
task = response.json()
```

---

### Node.js

```javascript
const fetch = require('node-fetch')

const API_KEY = 'tt_1234567890_abcdefghijklmnop'
const BASE_URL = 'https://your-domain.com/api/v1'

const headers = {
  'X-API-Key': API_KEY,
  'Content-Type': 'application/json'
}

// Получить все задачи
const response = await fetch(`${BASE_URL}/tasks`, { headers })
const tasks = await response.json()

// Создать задачу
const newTask = await fetch(`${BASE_URL}/tasks`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    title: 'Новая задача',
    priority: 'high',
    listId: 'list-123'
  })
})
```

---

## ⚠️ Ошибки

### Стандартные коды ошибок

- `400 Bad Request` - Неверный запрос
- `401 Unauthorized` - Неверный или отсутствующий API ключ
- `403 Forbidden` - Недостаточно прав
- `404 Not Found` - Ресурс не найден
- `429 Too Many Requests` - Превышен лимит запросов
- `500 Internal Server Error` - Внутренняя ошибка сервера

### Формат ошибки

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Task not found"
  }
}
```

---

## 🔒 Права доступа

При создании API ключа можно выбрать права доступа:

- `tasks:read` - Чтение задач
- `tasks:write` - Создание и обновление задач
- `tasks:delete` - Удаление задач
- `lists:read` - Чтение списков
- `lists:write` - Создание и обновление списков
- `lists:delete` - Удаление списков
- `projects:read` - Чтение проектов
- `projects:write` - Создание и обновление проектов
- `users:read` - Чтение пользователей

---

## 📚 Дополнительные ресурсы

- **Управление API ключами:** Sidebar → "🔌 API Management"
- **Примеры кода:** См. раздел "Примеры использования"
- **Версионирование:** API версия указывается в заголовке `X-API-Version`

---

**Готово к использованию!** 🚀

