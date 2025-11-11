"use client"

import * as z from "zod"
import { useForm, Controller } from "react-hook-form"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { AlertCircle, Loader2 } from "lucide-react"

// Keep your original imports and schema
import { LoginSchema } from "@/lib/validations/login-schema"
import { login } from "@/lib/auth-actions/login"

// Custom styled alert components for errors and success
const FormError = ({ message }: { message?: string }) => {
  if (!message) return null
  return (
    <div className="flex items-start gap-3 p-4 border rounded-lg bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50">
      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
      <div>
        <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">Authentication failed</h3>
        <p className="text-sm text-red-700 dark:text-red-400">{message}</p>
      </div>
    </div>
  )
}

const FormSuccess = ({ message }: { message?: string }) => {
  if (!message) return null
  return (
    <div className="flex items-start gap-3 p-4 border rounded-lg bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50">
      <AlertCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p>
      </div>
    </div>
  )
}

export const LoginForm = () => {
  const searchParams = useSearchParams()
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [error, setError] = useState<string | undefined>("")
  const [success, setSuccess] = useState<string | undefined>("")
  const [isLoading, setIsLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      username: "",
      passwordHash: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof LoginSchema>) => {
    setError("")
    setSuccess("")
    setIsLoading(true)
    try {
      const data = await login(values)
      if (data?.error) {
        setError(data.error)
      } else if (data.success) {
        window.location.assign("/setup")
      }
    } catch (error) {
      setError(`An unexpected error occurred. Please try again. ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">Tropicana Worldwide Corporation</h1>
          <p className="text-base sm:text-lg font-medium text-muted-foreground">Sign in to access your dashboard</p>
        </div>

        {/* Login Form */}
        <div className="mb-6">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Welcome back! 👋</h2>
            <p className="text-muted-foreground font-medium text-sm sm:text-base">
              {showTwoFactor ? "Enter your verification code" : "Enter your credentials to continue"}
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {showTwoFactor ? (
              // --- 2FA Code Field ---
              <div className="space-y-2 sm:space-y-3">
                <label htmlFor="code" className="block text-sm font-semibold">
                  Verification Code
                </label>
                <Controller
                  name="code"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      id="code"
                      type="text"
                      placeholder="123456"
                      disabled={isLoading}
                      className="w-full h-10 sm:h-12 text-sm sm:text-base font-medium px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  )}
                />
                {errors.code && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.code.message}</p>
                )}
              </div>
            ) : (
              <>
                {/* --- Username Field --- */}
                <div className="space-y-2 sm:space-y-3">
                  <label htmlFor="username" className="block text-sm font-semibold">
                    Username
                  </label>
                  <Controller
                    name="username"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        disabled={isLoading}
                        className="w-full h-10 sm:h-12 text-sm sm:text-base font-medium px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    )}
                  />
                  {errors.username && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.username.message}</p>
                  )}
                </div>

                {/* --- Password Field --- */}
                <div className="space-y-2 sm:space-y-3">
                  <label htmlFor="passwordHash" className="block text-sm font-semibold">
                    Password
                  </label>
                  <Controller
                    name="passwordHash"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        id="passwordHash"
                        type="password"
                        placeholder="Enter your password"
                        disabled={isLoading}
                        className="w-full h-10 sm:h-12 text-sm sm:text-base font-medium px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    )}
                  />
                  {errors.passwordHash && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.passwordHash.message}</p>
                  )}
                </div>
              </>
            )}

            {/* Error and Success Messages */}
            {error && <FormError message={error} />}
            {success && <FormSuccess message={success} />}

            {/* --- Submit Button --- */}
            <div className="pt-1 sm:pt-2">
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isLoading}
                className="w-full h-10 sm:h-12 font-semibold text-sm sm:text-base bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {showTwoFactor ? "Verifying..." : "Signing in..."}
                  </>
                ) : (
                  showTwoFactor ? "Verify & Access System" : "Sign in"
                )}
              </button>
            </div>
          </div>

          {/* Support Contact */}
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t text-center">
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 font-medium">Need help accessing your account?</p>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold hover:underline"
            >
              Request Account
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
            By signing in, you agree to our{" "}
            <Link
              href="#"
              className="hover:underline font-semibold"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="#"
              className="hover:underline font-semibold"
            >
              Privacy Policy
            </Link>
            .
          </p>
          <div className="mt-3 flex justify-center">
            <span className="text-xs font-mono text-muted-foreground border px-2 py-1 rounded">
              v1.0.0
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}