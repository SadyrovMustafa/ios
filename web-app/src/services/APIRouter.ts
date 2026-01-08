import { APIService, APIRequest, APIResponse } from './APIService'

/**
 * API Router для обработки HTTP запросов
 * Работает как middleware между клиентом и APIService
 */
export class APIRouter {
  private static basePath = '/api/v1'

  /**
   * Обработка HTTP запроса
   */
  static async handleHTTPRequest(
    method: string,
    url: string,
    headers: Record<string, string> = {},
    body?: any
  ): Promise<Response> {
    try {
      // Parse URL
      const urlObj = new URL(url, window.location.origin)
      const path = urlObj.pathname.replace(this.basePath, '')
      const query: Record<string, string> = {}
      urlObj.searchParams.forEach((value, key) => {
        query[key] = value
      })

      // Create API request
      const apiRequest: APIRequest = {
        method: method as any,
        path: path || '/',
        headers,
        body,
        query
      }

      // Handle request
      const apiResponse = await APIService.handleRequest(apiRequest)

      // Convert to HTTP Response
      return new Response(
        apiResponse.data !== undefined ? JSON.stringify(apiResponse.data) : null,
        {
          status: apiResponse.status,
          headers: {
            'Content-Type': 'application/json',
            'X-API-Version': '1.0.0'
          }
        }
      )
    } catch (error: any) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Internal server error'
          }
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }

  /**
   * Создание fetch-совместимого API клиента
   */
  static createAPIClient(apiKey: string, baseURL: string = this.basePath) {
    return {
      async request(method: string, path: string, body?: any, query?: Record<string, string>): Promise<any> {
        const url = new URL(path, window.location.origin)
        url.pathname = baseURL + path
        
        if (query) {
          Object.entries(query).forEach(([key, value]) => {
            url.searchParams.append(key, value)
          })
        }

        const response = await fetch(url.toString(), {
          method,
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey
          },
          body: body ? JSON.stringify(body) : undefined
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
          throw new Error(error.error?.message || `HTTP ${response.status}`)
        }

        return response.json()
      },

      // Convenience methods
      get(path: string, query?: Record<string, string>) {
        return this.request('GET', path, undefined, query)
      },

      post(path: string, body?: any) {
        return this.request('POST', path, body)
      },

      put(path: string, body?: any) {
        return this.request('PUT', path, body)
      },

      patch(path: string, body?: any) {
        return this.request('PATCH', path, body)
      },

      delete(path: string) {
        return this.request('DELETE', path)
      }
    }
  }
}

