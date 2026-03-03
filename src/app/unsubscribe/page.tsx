"use client"

import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, Suspense } from "react"
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react"
import { unsubscribeAction } from "@/app/actions/unsubscribe-action"
import { useAction } from "next-safe-action/hooks"
import Link from "next/link"

const CityScene = dynamic(
  () => import("@/components/home/city-scene").then((mod) => mod.CityScene),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-black" />,
  }
)

function UnsubscribeForm() {
  const [email, setEmail] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  const { execute, status } = useAction(unsubscribeAction, {
    onSuccess: () => {
      setIsSuccess(true)
      setEmail("")
    },
    onError: ({ error }) => {
      alert(error.serverError || "Failed to unsubscribe. Please try again.")
    },
  })

  const isLoading = status === "executing"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    execute({ email })
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-black text-white">
      <CityScene />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#000000_85%)] pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center pointer-events-none">
        <div className="max-w-xl w-full bg-black/70 backdrop-blur-2xl p-8 md:p-12 rounded-3xl shadow-2xl border border-white/10 pointer-events-auto transition-all animate-in fade-in zoom-in duration-1000 slide-in-from-bottom-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-white/40 hover:text-white/70 mb-8 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight drop-shadow-lg">
            Unsubscribe
          </h1>

          <p className="text-lg text-white/80 mb-10 leading-relaxed font-light tracking-wide max-w-lg mx-auto">
            We&apos;re sorry to see you go. Enter your email address below to be removed from our mailing list.
          </p>

          {isSuccess ? (
            <div className="flex flex-col items-center justify-center p-8 bg-white/5 rounded-2xl border border-white/10 text-white animate-in fade-in zoom-in duration-500">
              <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center mb-4 ring-1 ring-white/20">
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>
              <p className="font-semibold text-xl tracking-tight">You&apos;ve been unsubscribed</p>
              <p className="text-sm text-white/60 mt-2 font-light">
                Your email has been removed from our records.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 relative z-20"
            >
              <div className="relative grow">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  className="h-14 w-full bg-black/50 border-white/10 text-lg text-white placeholder:text-white/40 focus-visible:ring-white/20 focus-visible:border-white/30 rounded-xl px-6 transition-all hover:bg-black/70 backdrop-blur-md"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-14 px-8 text-base font-semibold bg-white text-black hover:bg-white/90 rounded-xl shadow-lg transition-all duration-300 w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Unsubscribing...
                  </>
                ) : (
                  "Unsubscribe Me"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <UnsubscribeForm />
    </Suspense>
  )
}

