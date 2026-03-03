import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { createORPCReactQueryUtils } from '@orpc/react-query'
import type { ContractRouterClient } from '@orpc/contract'
import type { AppContract } from './shared/contract.js'

let API_URL = import.meta.env.VITE_API_URL || ''

// Ensure it has a protocol and no trailing slash
if (API_URL) {
    if (!API_URL.startsWith('http')) {
        API_URL = `https://${API_URL}`
    }
    API_URL = API_URL.replace(/\/$/, '')
}

export const orpcClient = createORPCClient<ContractRouterClient<AppContract>>(
    new RPCLink({
        url: `${API_URL}/api`,
        fetch: (request, init) => fetch(request, { ...init, credentials: 'include' })
    })
)



export const orpc = createORPCReactQueryUtils(orpcClient)

