export const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3001'
).replace(/\/+$/, '')

export async function request(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, options)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      throw error
    throw new Error(
      'Cannot reach the server. Check your connection and make sure the backend is running, then try again.',
      { cause: error },
    )
  }
  if (!response.ok) {
    let message = `Request failed (${response.status}). Please try again.`
    try {
      const body: { message?: string | string[] } = await response.json()
      if (body.message)
        message = Array.isArray(body.message)
          ? body.message.join(' ')
          : body.message
    } catch {
      /* Fall back to a useful message for non-JSON server responses. */
    }
    throw new Error(message)
  }
  return response
}

export async function send<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await request(path, options)
  try {
    return (await response.json()) as T
  } catch (error) {
    throw new Error(
      'The server returned an unexpected response. Check the API configuration and try again.',
      { cause: error },
    )
  }
}
