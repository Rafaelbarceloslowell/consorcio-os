"use client"

import {
  useState,
} from "react"

import {
  LogOut,
} from "lucide-react"

import {
  Button,
} from "@/components/ui/button"

import {
  authClient,
} from "@/lib/auth/auth-client"

export function LogoutButton() {
  const [pending, setPending] =
    useState(false)

  async function handleLogout() {
    if (pending) {
      return
    }

    setPending(true)

    await authClient.signOut({
      fetchOptions: {
        onSuccess() {
          window.location.href =
            "/login"
        },
        onError() {
          setPending(false)
        },
      },
    })
  }

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={pending}
      onClick={handleLogout}
    >
      <LogOut />
      {pending
        ? "Saindo..."
        : "Sair"}
    </Button>
  )
}
