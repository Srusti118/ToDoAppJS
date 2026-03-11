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
        fetch: (request, init) => {
            const token = localStorage.getItem('auth_token')
            
            // CRITICAL: Load headers from the Request object first, then merge from init
            const headers = new Headers(request.headers)
            if ((init as any)?.headers) {
                const initHeaders = new Headers((init as any).headers)
                initHeaders.forEach((value, key) => headers.set(key, value))
            }

            if (token) {
                headers.set('Authorization', `Bearer ${token}`)
            }

            // Force Content-Type to application/json to ensure backend parses body correctly
            headers.set('Content-Type', 'application/json')

            return fetch(request, {
                ...(init as any),
                headers,
            })
        }
    })
)



export const orpc = createORPCReactQueryUtils(orpcClient)

