"use client"

import { Button } from '@/components/ui/button'
import { signIn } from '@/lib/auth-client'
import React, { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function SignInPage() {
    const [isLoading, setIsLoading] = useState(false)

    const handleGoogleSignIn = async () => {
        setIsLoading(true)
        try {
            await signIn.social({
                provider: "google",
                callbackURL: "/dashboard",
                errorCallbackURL: "/error",
                newUserCallbackURL: "/onboarding",
            })
        } catch (error) {
            console.error("Sign in failed:", error)
            setIsLoading(false)
        }
    }

    return (
        <div className="container relative min-h-svh flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
            {/* Left Panel - Branding (Dark Theme) */}
            <div className="relative hidden h-full flex-col bg-zinc-950 p-10 text-white dark:border-r lg:flex overflow-hidden">
                <div className="absolute inset-0 bg-zinc-950" />
                
                {/* Subtle Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                
                {/* Radial gradient for a subtle glow effect */}
                <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]" />

                <div className="relative z-20 flex items-center gap-2 text-lg font-medium">
                    <img 
                        src="/logo/scrunity_logo_svg.svg" 
                        alt="Scrunity Logo" 
                        className="h-8 w-8 rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]" 
                    />
                    Scrunity
                </div>
                
                <div className="relative z-20 mt-auto">
                    <div className="flex items-center gap-2 mb-4 text-zinc-400">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium tracking-wide uppercase">Premium Experience</span>
                    </div>
                    <blockquote className="space-y-2">
                        <p className="text-2xl text-zinc-100 font-medium text-balance leading-snug">
                            &ldquo;This platform has completely transformed how we deliver projects and collaborate with our clients. Everything is exactly where it needs to be.&rdquo;
                        </p>
                        <footer className="text-sm text-zinc-400 mt-4">Sofia Davis, Agency Founder</footer>
                    </blockquote>
                </div>
            </div>

            {/* Right Panel - Auth Form */}
            <div className="lg:p-8 relative w-full h-full flex items-center justify-center">
                <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[380px] px-4 lg:px-0">
                    {/* Header */}
                    <div className="flex flex-col space-y-2 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both">
                        <div className="flex justify-center lg:hidden mb-4">
                            <img 
                                src="/logo/scrunity_logo_svg.svg" 
                                alt="Scrunity Logo" 
                                className="h-10 w-10 rounded-lg shadow-sm" 
                            />
                        </div>
                        <h1 className="text-3xl font-semibold tracking-tight text-balance">
                            Welcome back
                        </h1>
                        <p className="text-sm text-muted-foreground text-balance">
                            Sign in to your account to continue delivering great work.
                        </p>
                    </div>

                    {/* Auth Methods */}
                    <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 ease-out fill-mode-both">
                        <Button 
                            variant="outline" 
                            type="button" 
                            disabled={isLoading}
                            onClick={handleGoogleSignIn}
                            className="h-11 relative overflow-hidden group active:scale-[0.96] transition-transform shadow-sm hover:shadow"
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                            )}
                            <span className="font-medium">Continue with Google</span>
                        </Button>
                        
                        <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground font-medium">
                                    Enterprise
                                </span>
                            </div>
                        </div>

                        <Button 
                            variant="secondary" 
                            type="button" 
                            disabled={true}
                            className="h-11 active:scale-[0.96] transition-transform"
                        >
                            Continue with SAML SSO
                        </Button>
                    </div>
                    
                    {/* Footer */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 ease-out fill-mode-both">
                        <p className="px-8 text-center text-sm text-muted-foreground text-balance">
                            By clicking continue, you agree to our{" "}
                            <Link
                                href="/terms"
                                className="underline underline-offset-4 hover:text-primary transition-colors"
                            >
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link
                                href="/privacy"
                                className="underline underline-offset-4 hover:text-primary transition-colors"
                            >
                                Privacy Policy
                            </Link>
                            .
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
