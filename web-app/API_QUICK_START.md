# 🚀 REST API - Быстрый старт

## ⚡ За 5 минут

### 1. Создайте API ключ

1. Откройте приложение
2. Sidebar → "🔌 API Management"
3. Нажмите "+ Создать API ключ"
4. Введите название (например: "Мой API ключ")
5. Выберите права доступа
6. **Сохраните ключ!** Он больше не будет показан

---

### 2. Используйте API

#### JavaScript (в браузере)

```javascript
const apiKey = 'tt_ваш_ключ'
const baseURL = '/api/v1'

// Получить все задачи
fetch(`${baseURL}/tasks`, {
  headers: { 'X-API-Key': apiKey }
})
  .then(res => res.json())
  .then(tasks => console.log(tasks))

// Создать задачу
fetch(`${baseURL}/tasks`, {
  method: 'POST',
  headers: {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Новая задача',
    priority: 'high'
  })
})
  .then(res => res.json())
  .then(task => console.log('Создана:', task))
```

---

#### cURL

```bash
# Получить задачи
curl -H "X-API-Key: tt_ваш_ключ" \
  http://localhost:3000/api/v1/tasks

# Создать задачу
curl -X POST \
  -H "X-API-Key: tt_ваш_ключ" \
  -H "Content-Type: application/json" \
  -d '{"title":"Новая задача","priority":"high"}' \
  http://localhost:3000/api/v1/tasks
```

---

## 📚 Полная документация

- **API Documentation:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Примеры:** [API_EXAMPLES.md](./API_EXAMPLES.md)

---

## 🔗 Endpoints

- `GET /tasks` - Получить все задачи
- `GET /tasks/:id` - Получить задачу
- `POST /tasks` - Создать задачу
- `PATCH /tasks/:id` - Обновить задачу
- `DELETE /tasks/:id` - Удалить задачу
- `GET /lists` - Получить все списки
- `GET /projects` - Получить все проекты
- `GET /users` - Получить всех пользователей

---

**Готово!** Теперь вы можете использовать REST API! 🎉

