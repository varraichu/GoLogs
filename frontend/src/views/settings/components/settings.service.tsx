// settings.service.tsx
// Service functions for DatabaseRetentionSettings

export async function fetchRetention(token: string) {
  const resp = await fetch('http://localhost:3001/api/logs/get/ttl', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  const data = await resp.json()
  return { ok: resp.ok, data }
}

export async function patchRetention(token: string, newTTLInDays: number) {
  const resp = await fetch('http://localhost:3001/api/logs/config/ttl', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newTTLInDays }),
  })
  const data = await resp.json()
  return { ok: resp.ok, data }
}

export async function fetchSettings(token: string, userId: string) {
  const resp = await fetch(`http://localhost:3001/api/settings/${userId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  const data = await resp.json()
  return { ok: resp.ok, data }
}

export async function patchSettings(token: string, userId: string, settings: any) {
  const resp = await fetch(`http://localhost:3001/api/settings/${userId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      Object.fromEntries(Object.entries(settings).filter(([_, value]) => value !== null))
    ),
  })
  const data = await resp.json()
  return { ok: resp.ok, data }
}
