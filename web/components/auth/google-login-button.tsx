"use client"

import {
  useState,
} from "react"

import {
  LogIn,
  LoaderCircle,
} from "lucide-react"

import {
  Button,
} from "@/components/ui/button"

import {
  authClient,
} from "@/lib/auth/auth-client"

type GoogleLoginButtonProps = {
  configured: boolean
}

export function GoogleLoginButton({
  configured,
}: GoogleLoginButtonProps) {
  const [pending, setPending] =
    useState(false)

  const [message, setMessage] =
    useState<string | null>(null)

  async function handleGoogleLogin() {
    if (!configured || pending) {
      return
    }

    setPending(true)
    setMessage(null)

    const result =
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
        errorCallbackURL:
          "/acesso-negado",
      })

    if (result.error) {
      setPending(false)
      setMessage(
        result.error.message ??
          "Nao foi possivel iniciar o acesso com Google.",
      )
    }
  }

  return (
    <div className="mt-7 space-y-3">
      <Button
        type="button"
        fullWidth
        size="lg"
        disabled={
          !configured ||
          pending
        }
        onClick={
          handleGoogleLogin
        }
      >
        {pending ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <LogIn />
        )}
        {configured
          ? pending
            ? "Abrindo Google..."
            : "Continuar com Google"
          : "Google aguardando configuração"}
      </Button>

      {message ? (
        <p
          role="alert"
          className="text-center text-xs leading-5 text-red-300"
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}
