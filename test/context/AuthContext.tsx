"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { GoogleOAuthProvider, googleLogout, useGoogleLogin } from "@react-oauth/google"
import { useRouter } from "next/navigation"

const GOOGLE_CLIENT_ID =
    "713705145723-h8pfq3qqkga5ao8f8c3hcf5c721mjt44.apps.googleusercontent.com"

// Dummy credentials for email/password login
const DUMMY_EMAIL = "abc@gmail.com"
const DUMMY_PASSWORD = "abc12345"

export interface User {
    name: string
    email: string
    picture?: string
    provider: "google" | "email"
}

interface AuthContextType {
    user: User | null
    isLoading: boolean
    signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
    signOut: () => void
    signInWithGoogle: (credentialResponse: { credential?: string; access_token?: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
    return ctx
}

function AuthProviderInner({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    // Load user from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem("ss_user")
            if (stored) setUser(JSON.parse(stored))
        } catch { }
        setIsLoading(false)
    }, [])

    const persistUser = (u: User) => {
        setUser(u)
        localStorage.setItem("ss_user", JSON.stringify(u))
    }

    const signIn = async (email: string, password: string) => {
        setIsLoading(true)
        await new Promise((r) => setTimeout(r, 800))
        if (email === DUMMY_EMAIL && password === DUMMY_PASSWORD) {
            persistUser({
                name: "Alex Morgan",
                email,
                picture: undefined,
                provider: "email",
            })
            setIsLoading(false)
            return { success: true }
        }
        setIsLoading(false)
        return { success: false, error: "Invalid credentials. Use abc@gmail.com / abc12345" }
    }

    const signInWithGoogle = async (credentialResponse: {
        credential?: string
        access_token?: string
    }) => {
        setIsLoading(true)
        try {
            let name = "Google User"
            let email = ""
            let picture: string | undefined

            if (credentialResponse.credential) {
                // Decode JWT to get user info
                const payload = JSON.parse(atob(credentialResponse.credential.split(".")[1]))
                name = payload.name || name
                email = payload.email || ""
                picture = payload.picture
            } else if (credentialResponse.access_token) {
                // Fetch user info from Google API
                const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                    headers: { Authorization: `Bearer ${credentialResponse.access_token}` },
                })
                const data = await res.json()
                name = data.name || name
                email = data.email || ""
                picture = data.picture
            }

            persistUser({ name, email, picture, provider: "google" })
        } catch (e) {
            console.error("Google sign-in error", e)
        }
        setIsLoading(false)
    }

    const signOut = () => {
        googleLogout()
        setUser(null)
        localStorage.removeItem("ss_user")
        router.push("/login")
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, signOut, signInWithGoogle }}>
            {children}
        </AuthContext.Provider>
    )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AuthProviderInner>{children}</AuthProviderInner>
        </GoogleOAuthProvider>
    )
}
