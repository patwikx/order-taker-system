"use client"

import * as z from "zod"
import { useForm, Controller } from "react-hook-form"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { Eye, EyeOff, Hotel, Users, Calendar, Shield, Wifi } from "lucide-react"

// Keep your original imports and schema
import { LoginSchema } from "@/lib/validations/login-schema"
import { login } from "@/lib/auth-actions/login"

// Custom styled alert components for errors and success
const FormError = ({ message }: { message?: string }) => {
  if (!message) return null
  return (
    <div className="bg-red-950/30 border border-red-900/50 text-red-300 px-4 py-3 rounded-lg mb-4 backdrop-blur-sm">
      {message}
    </div>
  )
}

const FormSuccess = ({ message }: { message?: string }) => {
  if (!message) return null
  return (
    <div className="bg-emerald-950/30 border border-emerald-900/50 text-emerald-300 px-4 py-3 rounded-lg mb-4 backdrop-blur-sm">
      {message}
    </div>
  )
}

// Feature item component for the left panel
const FeatureItem = ({ icon: Icon, title, description }: { 
  icon: React.ComponentType<{ className?: string }>, 
  title: string, 
  description: string 
}) => (
  <div className="flex gap-4 mb-8">
    <div className="bg-black/40 border border-gray-800 rounded-lg p-3 flex items-center justify-center min-w-[48px] h-12 backdrop-blur-sm">
      <Icon className="text-amber-400 w-6 h-6" />
    </div>
    <div>
      <h3 className="text-gray-50 font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  </div>
)

export const LoginForm = () => {
  const searchParams = useSearchParams()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const callbackUrl = searchParams?.get("callbackUrl")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [error, setError] = useState<string | undefined>("")
  const [success, setSuccess] = useState<string | undefined>("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
        // On successful login, redirect to the dashboard or home page
        window.location.assign("/setup")
      }
    } catch (error) {
      setError(`An unexpected error occurred. Please try again. ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen bg-black flex relative overflow-hidden">
      {/* Pitch black background with subtle gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-black"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.02),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.01),transparent_50%)]"></div>
      
      {/* Left Panel - Hotel Features */}
      <div className="hidden lg:flex lg:w-7/12 bg-transparent p-8 xl:p-16 flex-col justify-center relative z-10">
        {/* Logo and Brand */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-2">
            <Hotel className="text-amber-500 w-9 h-9" />
            <h1 className="text-gray-50 text-2xl font-bold">Tropicana Worldwide Corporation</h1>
          </div>
          <p className="text-gray-400 text-sm ml-12">Premium Hotel Management & Booking System</p>
        </div>

        {/* Features List */}
        <div className="max-w-lg">
          <FeatureItem
            icon={Calendar}
            title="Advanced Booking Management"
            description="Streamline reservations with intelligent scheduling, real-time availability, and automated confirmation systems."
          />
          
          <FeatureItem
            icon={Users}
            title="Guest Experience Excellence"
            description="Deliver personalized service with comprehensive guest profiles, preferences tracking, and loyalty program integration."
          />
          
          <FeatureItem
            icon={Shield}
            title="Enterprise Security"
            description="Bank-level encryption and security protocols protect sensitive guest data and payment information."
          />
          
          <FeatureItem
            icon={Wifi}
            title="Cloud-Based Infrastructure"
            description="Access your hotel management system anywhere with reliable cloud hosting and real-time synchronization."
          />
        </div>

        {/* Bottom accent */}
        <div className="mt-16 pt-8 border-t border-gray-800/50">
          <p className="text-gray-500 text-xs">
            Trusted by luxury hotels worldwide • ISO 27001 Certified • 24/7 Support
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-5/12 bg-black/95 backdrop-blur-sm flex items-center justify-center p-6 lg:p-8 relative z-10 border-l border-gray-900/50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <Hotel className="text-amber-500 w-8 h-8" />
            <div className="text-center">
              <h1 className="text-gray-50 text-xl font-bold">Tropicana Worldwide</h1>
              <p className="text-gray-500 text-xs">Hotel System</p>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-gray-50 text-3xl font-semibold mb-2">
              {showTwoFactor ? "Two-Factor Authentication" : "Welcome Back"}
            </h2>
            {!showTwoFactor && (
              <p className="text-gray-400">Access your hotel management dashboard</p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {showTwoFactor ? (
              // --- 2FA Code Field ---
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Verification Code
                </label>
                <Controller
                  name="code"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="123456"
                      disabled={isLoading}
                      className="w-full h-14 bg-black border border-gray-800 rounded-lg px-4 text-gray-100 text-xl tracking-wider text-center focus:border-amber-500 focus:outline-none transition-all duration-200 focus:ring-1 focus:ring-amber-500/20"
                    />
                  )}
                />
                {errors.code && (
                  <p className="text-red-400 text-sm mt-1">{errors.code.message}</p>
                )}
              </div>
            ) : (
              <>
                {/* --- Username Field --- */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Username
                  </label>
                  <Controller
                    name="username"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="Enter your username"
                        disabled={isLoading}
                        className="w-full h-14 bg-black border border-gray-800 rounded-lg px-4 text-gray-100 focus:border-amber-500 focus:outline-none transition-all duration-200 focus:ring-1 focus:ring-amber-500/20"
                      />
                    )}
                  />
                  {errors.username && (
                    <p className="text-red-400 text-sm mt-1">{errors.username.message}</p>
                  )}
                </div>

                {/* --- Password Field --- */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-gray-300 text-sm font-medium">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <Controller
                      name="passwordHash"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          disabled={isLoading}
                          className="w-full h-14 bg-black border border-gray-800 rounded-lg px-4 pr-12 text-gray-100 focus:border-amber-500 focus:outline-none transition-all duration-200 focus:ring-1 focus:ring-amber-500/20"
                        />
                      )}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-amber-400 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.passwordHash && (
                    <p className="text-red-400 text-sm mt-1">{errors.passwordHash.message}</p>
                  )}
                </div>

                {/* --- Remember Me --- */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember"
                      className="w-4 h-4 text-amber-600 bg-black border-gray-700 rounded focus:ring-amber-500 focus:ring-2"
                    />
                    <label htmlFor="remember" className="ml-2 text-gray-400 text-sm">
                      Remember me
                    </label>
                  </div>
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </>
            )}

            {/* Error and Success Messages */}
            <FormError message={error} />
            <FormSuccess message={success} />

            {/* --- Submit Button --- */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 text-black font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/20"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  <span>{showTwoFactor ? "Verifying..." : "Signing in..."}</span>
                </>
              ) : (
                <span>{showTwoFactor ? "Verify & Access System" : "Login"}</span>
              )}
            </button>

            {/* Footer Links */}
            {!showTwoFactor && (
              <div className="text-center pt-4 border-t border-gray-900/50">
                <p className="text-gray-500 text-sm">
                  Need access to the system?{' '}
                  <Link 
                    href="/auth/register" 
                    className="text-white-400 hover:text-blue-500 font-medium transition-colors"
                  >
                    Request Account
                  </Link>
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}