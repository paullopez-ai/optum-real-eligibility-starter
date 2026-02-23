interface TokenCache {
  token: string
  expiresAt: number
}

let cachedToken: TokenCache | null = null

function isDevelopmentMode(): boolean {
  return process.env.NEXT_PUBLIC_APP_ENV === 'development' && !process.env.OPTUM_CLIENT_ID
}

export async function getOptumToken(): Promise<string> {
  if (isDevelopmentMode()) {
    return 'mock-bearer-token-development'
  }

  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token
  }

  const clientId = process.env.OPTUM_CLIENT_ID
  const clientSecret = process.env.OPTUM_CLIENT_SECRET
  const authUrl = process.env.OPTUM_AUTH_URL

  if (!clientId || !clientSecret || !authUrl) {
    throw new Error('Missing Optum API credentials. Set OPTUM_CLIENT_ID, OPTUM_CLIENT_SECRET, and OPTUM_AUTH_URL in .env.local')
  }

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!response.ok) {
    throw new Error(`Optum auth failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  }

  return cachedToken.token
}
