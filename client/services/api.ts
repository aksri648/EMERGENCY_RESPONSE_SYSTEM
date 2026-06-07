const BASE = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:3000';

export interface TokenResponse {
  token: string;
  roomName: string;
  wsUrl: string;
}

export async function getToken(opts: {
  identity: string;
  roomName?: string;
  photoUrl?: string;
}): Promise<TokenResponse> {
  const res = await fetch(`${BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  });
  if (!res.ok) throw new Error(`Token request failed (${res.status})`);
  return (await res.json()) as TokenResponse;
}

export async function uploadPhoto(uri: string): Promise<string> {
  const form = new FormData();
  // React Native FormData accepts { uri, name, type } objects.
  form.append('photo', {
    uri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);
  const res = await fetch(`${BASE}/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  const data = (await res.json()) as { url: string };
  return data.url;
}
