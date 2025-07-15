// settings.service.tsx
// Service functions for DatabaseRetentionSettings

export async function fetchRetention() {
  const resp = await fetch('http://localhost:3001/api/logs/get/ttl', {
    method: 'GET',
    credentials: 'include',
  })
  const data = await resp.json()
  return { ok: resp.ok, data }
}

export async function patchRetention(newTTLInDays: number) {
  const resp = await fetch('http://localhost:3001/api/logs/config/ttl', {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newTTLInDays }),
  })
  const data = await resp.json()
  return { ok: resp.ok, data }
}

export async function fetchSettings(userId: string) {
  const resp = await fetch(`http://localhost:3001/api/settings/${userId}`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await resp.json()
  return { ok: resp.ok, data }
}

export async function patchSettings(userId: string, settings: any) {
  const resp = await fetch(`http://localhost:3001/api/settings/${userId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      Object.fromEntries(Object.entries(settings).filter(([_, value]) => value !== null))
    ),
  })
  const data = await resp.json()
  return { ok: resp.ok, data }
}
