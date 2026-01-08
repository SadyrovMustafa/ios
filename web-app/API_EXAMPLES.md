# 📚 Примеры использования REST API

## 🔧 Настройка

### Получение API ключа

1. Откройте приложение
2. Sidebar → "🔌 API Management"
3. Создайте новый API ключ
4. Сохраните ключ в безопасном месте

### Base URL

```
https://your-domain.com/api/v1
```

---

## 📝 Примеры на разных языках

### JavaScript/TypeScript (Browser)

```typescript
// Создание API клиента
const apiKey = 'tt_1234567890_abcdefghijklmnop'
const baseURL = '/api/v1'

async function getTasks() {
  const response = await fetch(`${baseURL}/tasks`, {
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json'
    }
  })
  return response.json()
}

async function createTask(task: any) {
  const response = await fetch(`${baseURL}/tasks`, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(task)
  })
  return response.json()
}

// Использование
const tasks = await getTasks()
const newTask = await createTask({
  title: 'Новая задача',
  priority: 'high',
  listId: 'list-123'
})
```

---

### Node.js

```javascript
const fetch = require('node-fetch')

class TickTickAPI {
  constructor(apiKey, baseURL = 'https://your-domain.com/api/v1') {
    this.apiKey = apiKey
    this.baseURL = baseURL
  }

  async request(method, path, body = null) {
    const url = `${this.baseURL}${path}`
    const options = {
      method,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      }
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async getTasks(filters = {}) {
    const query = new URLSearchParams(filters).toString()
    return this.request('GET', `/tasks?${query}`)
  }

  async getTask(id) {
    return this.request('GET', `/tasks/${id}`)
  }

  async createTask(task) {
    return this.request('POST', '/tasks', task)
  }

  async updateTask(id, updates) {
    return this.request('PATCH', `/tasks/${id}`, updates)
  }

  async deleteTask(id) {
    return this.request('DELETE', `/tasks/${id}`)
  }
}

// Использование
const api = new TickTickAPI('tt_1234567890_abcdefghijklmnop')

const tasks = await api.getTasks({ completed: 'false' })
const newTask = await api.createTask({
  title: 'Новая задача',
  priority: 'high'
})
```

---

### Python

```python
import requests
from typing import Optional, Dict, List

class TickTickAPI:
    def __init__(self, api_key: str, base_url: str = "https://your-domain.com/api/v1"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            "X-API-Key": api_key,
            "Content-Type": "application/json"
        }

    def _request(self, method: str, path: str, data: Optional[Dict] = None) -> Dict:
        url = f"{self.base_url}{path}"
        response = requests.request(method, url, headers=self.headers, json=data)
        response.raise_for_status()
        return response.json()

    def get_tasks(self, **filters) -> List[Dict]:
        query = "&".join([f"{k}={v}" for k, v in filters.items()])
        path = f"/tasks?{query}" if query else "/tasks"
        return self._request("GET", path)

    def get_task(self, task_id: str) -> Dict:
        return self._request("GET", f"/tasks/{task_id}")

    def create_task(self, task: Dict) -> Dict:
        return self._request("POST", "/tasks", task)

    def update_task(self, task_id: str, updates: Dict) -> Dict:
        return self._request("PATCH", f"/tasks/{task_id}", updates)

    def delete_task(self, task_id: str) -> None:
        self._request("DELETE", f"/tasks/{task_id}")

# Использование
api = TickTickAPI("tt_1234567890_abcdefghijklmnop")

tasks = api.get_tasks(completed="false", priority="high")
new_task = api.create_task({
    "title": "Новая задача",
    "priority": "high",
    "listId": "list-123"
})
```

---

### PHP

```php
<?php

class TickTickAPI {
    private $apiKey;
    private $baseURL;

    public function __construct($apiKey, $baseURL = "https://your-domain.com/api/v1") {
        $this->apiKey = $apiKey;
        $this->baseURL = $baseURL;
    }

    private function request($method, $path, $data = null) {
        $url = $this->baseURL . $path;
        $ch = curl_init($url);
        
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "X-API-Key: " . $this->apiKey,
            "Content-Type: application/json"
        ]);

        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 400) {
            throw new Exception("API Error: " . $response);
        }

        return json_decode($response, true);
    }

    public function getTasks($filters = []) {
        $query = http_build_query($filters);
        $path = "/tasks" . ($query ? "?" . $query : "");
        return $this->request("GET", $path);
    }

    public function createTask($task) {
        return $this->request("POST", "/tasks", $task);
    }
}

// Использование
$api = new TickTickAPI("tt_1234567890_abcdefghijklmnop");
$tasks = $api->getTasks(["completed" => "false"]);
$newTask = $api->createTask([
    "title" => "Новая задача",
    "priority" => "high"
]);
?>
```

---

### Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "net/url"
)

type TickTickAPI struct {
    APIKey  string
    BaseURL string
}

func NewTickTickAPI(apiKey string) *TickTickAPI {
    return &TickTickAPI{
        APIKey:  apiKey,
        BaseURL: "https://your-domain.com/api/v1",
    }
}

func (api *TickTickAPI) request(method, path string, body interface{}) ([]byte, error) {
    var reqBody io.Reader
    if body != nil {
        jsonData, _ := json.Marshal(body)
        reqBody = bytes.NewBuffer(jsonData)
    }

    req, _ := http.NewRequest(method, api.BaseURL+path, reqBody)
    req.Header.Set("X-API-Key", api.APIKey)
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    return io.ReadAll(resp.Body)
}

func (api *TickTickAPI) GetTasks(filters map[string]string) ([]map[string]interface{}, error) {
    values := url.Values{}
    for k, v := range filters {
        values.Add(k, v)
    }
    path := "/tasks"
    if len(values) > 0 {
        path += "?" + values.Encode()
    }

    data, err := api.request("GET", path, nil)
    if err != nil {
        return nil, err
    }

    var tasks []map[string]interface{}
    json.Unmarshal(data, &tasks)
    return tasks, nil
}

func (api *TickTickAPI) CreateTask(task map[string]interface{}) (map[string]interface{}, error) {
    data, err := api.request("POST", "/tasks", task)
    if err != nil {
        return nil, err
    }

    var result map[string]interface{}
    json.Unmarshal(data, &result)
    return result, nil
}

// Использование
func main() {
    api := NewTickTickAPI("tt_1234567890_abcdefghijklmnop")
    
    tasks, _ := api.GetTasks(map[string]string{"completed": "false"})
    fmt.Println(tasks)
    
    newTask, _ := api.CreateTask(map[string]interface{}{
        "title":    "Новая задача",
        "priority": "high",
    })
    fmt.Println(newTask)
}
```

---

## 🔄 Интеграции

### Zapier

```javascript
// Zapier Code Step
const response = await fetch('https://your-domain.com/api/v1/tasks', {
  method: 'POST',
  headers: {
    'X-API-Key': bundle.authData.api_key,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: bundle.inputData.title,
    priority: bundle.inputData.priority || 'medium',
    listId: bundle.inputData.listId
  })
})

return response.json()
```

---

### Make (Integromat)

1. Создайте новый сценарий
2. Добавьте модуль "HTTP Request"
3. Настройте:
   - **Method:** POST
   - **URL:** `https://your-domain.com/api/v1/tasks`
   - **Headers:** `X-API-Key: your-api-key`
   - **Body:** JSON с данными задачи

---

### IFTTT

```javascript
// IFTTT Webhook
fetch('https://your-domain.com/api/v1/tasks', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: '{{EventName}}',
    notes: '{{EventDescription}}'
  })
})
```

---

## 🎯 Типичные сценарии

### Синхронизация с внешней системой

```javascript
// Синхронизация задач каждые 5 минут
setInterval(async () => {
  const tasks = await api.getTasks({ completed: 'false' })
  
  // Отправить в другую систему
  await sendToExternalSystem(tasks)
}, 5 * 60 * 1000)
```

---

### Автоматическое создание задач из email

```javascript
// Webhook endpoint для email сервиса
app.post('/webhook/email', async (req, res) => {
  const email = req.body
  
  await api.createTask({
    title: email.subject,
    notes: email.body,
    priority: email.important ? 'high' : 'medium',
    tags: ['email', 'inbox']
  })
  
  res.sendStatus(200)
})
```

---

### Экспорт задач в CSV

```javascript
const tasks = await api.getTasks()
const csv = tasks.map(t => 
  `${t.id},${t.title},${t.isCompleted},${t.dueDate}`
).join('\n')

// Сохранить CSV файл
```

---

**Готово!** Теперь вы можете интегрировать TickTick API с любыми приложениями! 🚀

