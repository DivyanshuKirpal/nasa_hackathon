import type { IncomingMessage, ServerResponse } from 'node:http'

export function guidanceResponse(
  body: unknown,
  env: Record<string, string | undefined>,
): Promise<{ status: number; json: unknown }>

export function handleGuidanceNode(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
  env: Record<string, string | undefined>,
): Promise<void>
