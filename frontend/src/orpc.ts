import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { createORPCReactQueryUtils } from '@orpc/react-query'
import type { ContractRouterClient } from '@orpc/contract'
import type { AppContract } from './shared/contract.js'

const API_URL = import.meta.env.VITE_API_URL || ''

export const orpcClient = createORPCClient<ContractRouterClient<AppContract>>(
    new RPCLink({
        url: `${API_URL}/api`,
        fetch: (request, init) => fetch(request, { ...init, credentials: 'include' })
    })
)



export const orpc = createORPCReactQueryUtils(orpcClient)

