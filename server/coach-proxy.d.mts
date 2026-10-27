import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Server } from 'node:http'

export declare function coachConfig(env?: Record<string, string | undefined>): {
  base: string
  key: string
  model: string
}

export declare function loadEnvFile(file: string, env?: Record<string, string | undefined>): Record<string, string | undefined>

export declare function handleCoach(req: IncomingMessage, res: ServerResponse): Promise<void>

export declare function startCoachServer(opts?: { port?: number; host?: string }): Server
