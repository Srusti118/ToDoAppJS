import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import type { AppRouter } from '../../../backend/router.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const link = new RPCLink({
    url: `${API_URL}/rpc`,
})

export const orpc: RouterClient<AppRouter> = createORPCClient(link)
