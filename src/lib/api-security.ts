import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { ApiError } from '@/lib/api-validation';

export async function requireApiUser(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) throw new ApiError('Unauthorized', 401);
  return user;
}

/** Bound parsing work even for streamed requests without Content-Length. */
export async function readJsonObject(request: NextRequest): Promise<Record<string, unknown>> {
  const maxBytes = 64 * 1024;
  if (Number(request.headers.get('content-length')) > maxBytes) throw new ApiError('Request body is too large', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError('A JSON object is required');
  const decoder = new TextDecoder();
  let bytes = 0;
  let content = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        throw new ApiError('Request body is too large', 413);
      }
      content += decoder.decode(value, { stream: true });
    }
    content += decoder.decode();
  } finally {
    reader.releaseLock();
  }
  let body: unknown;
  try { body = JSON.parse(content); } catch { throw new ApiError('Invalid JSON body'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError('A JSON object is required');
  return body as Record<string, unknown>;
}

export function apiFailure(error: unknown, message: string) {
  // Preserve authentication responses that clear an invalid session's cookies.
  if (error instanceof NextResponse) return error;
  if (error instanceof ApiError) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  // Database errors can contain submitted clinical data; do not log their details.
  console.error(message);
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}

export function checkRecord<T>(data: T | null, error: { code?: string } | null, label: string): T {
  if (error && error.code !== 'PGRST116') throw error;
  if (error || !data) throw new ApiError(`${label} not found`, 404);
  return data;
}
