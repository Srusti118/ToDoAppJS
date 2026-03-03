import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { createORPCReactQueryUtils } from '@orpc/react-query'
import type { RouterClient } from '@orpc/server'
import type { AppRouter } from '../../backend/src/router.js'

const API_URL = import.meta.env.VITE_API_URL || ''

export const orpcClient = createORPCClient<RouterClient<AppRouter>>(
    new RPCLink({
        url: `${API_URL}/api`,
        fetch: (request, init) => fetch(request, { ...init, credentials: 'include' })
    })
)

export const orpc = createORPCReactQueryUtils(orpcClient)
