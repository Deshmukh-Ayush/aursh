"use client"

import { Button } from '@/components/ui/button'
import { signIn } from '@/lib/auth-client'
import React from 'react'

export default function SignInPage() {
    const clickHandler = async () => {
        await signIn.social({
            provider: "google",
            callbackURL: "/dashboard",
            errorCallbackURL: "/error",
            newUserCallbackURL: "/onboarding",
        })
    }
  return (
    <div>
        <h1>SignInPage</h1>
        <Button onClick={clickHandler}>Sign In</Button>
    </div>
  )
}
