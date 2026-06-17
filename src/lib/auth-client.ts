import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    plugins: [organizationClient()],
})

export const { signIn, signUp, useSession } = authClient