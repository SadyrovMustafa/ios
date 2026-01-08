/**
 * API Endpoint Handler
 * Обрабатывает HTTP запросы к API
 * 
 * Для использования в production нужен бэкенд сервер
 * В текущей реализации работает через APIService напрямую
 */

import { APIService, APIRequest, APIResponse } from '../services/APIService'

/**
 * Обработка API запроса через fetch
 * Используется для тестирования API в браузере
 */
export async function handleAPIRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    // Parse URL
    const urlObj = new URL(url, window.location.origin)
    const path = urlObj.pathname.replace('/api/v1', '') || '/'
    
    // Parse query
    const query: Record<string, string> = {}
    urlObj.searchParams.forEach((value, key) => {
      query[key] = value
    })

    // Get API key from headers
    const apiKey = (options.headers as any)?.['X-API-Key'] || 
                   (options.headers as any)?.['Authorization']?.replace('Bearer ', '')

    // Create API request
    const apiRequest: APIRequest = {
      method: (options.method || 'GET') as any,
      path,
      headers: {
        'X-API-Key': apiKey || '',
        ...(options.headers as Record<string, string>)
      },
      body: options.body ? JSON.parse(options.body as string) : undefined,
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
 * Перехват fetch запросов к /api/v1/*
 * Работает только в development режиме
 */
export function setupAPIInterceptor() {
  if (typeof window === 'undefined') return

  const originalFetch = window.fetch
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    
    // Intercept API requests
    if (url.includes('/api/v1')) {
      return handleAPIRequest(url, init)
    }

    // Use original fetch for other requests
    return originalFetch(input, init)
  }
}

