"use client"

import { useForm } from "react-hook-form"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/ModeToggle"

interface LoginFormInputs {
  email: string
  password: string
}

export default function LoginPage() {
  const form = useForm<LoginFormInputs>({
    defaultValues: {
      email: "admin@example.com",
      password: "1234",
    },
  })
  const [formError, setFormError] = useState("")
  const router = useRouter()

  const onSubmit = async (data: LoginFormInputs) => {
    setFormError("")
    form.clearErrors()
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      const result = await response.json()
      if (!response.ok) {
        if (result.error) {
          setFormError(result.error)
        } else {
          setFormError("Something went wrong")
        }
        return
      }
      localStorage.setItem("token", result.token)
      router.push("/dashboard")
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Invalid credentials")
    }
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 transition-colors relative`}
    >
      <div className="absolute top-4 right-4 z-10">
        <ModeToggle />
      </div>
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Sign in to your account
          </h2>
        </div>
        <Form {...form}>
          <form className="mt-8 space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-gray-200">Email address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="Email address"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-gray-200">Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      placeholder="Password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {formError && <div className="text-red-500 text-sm text-center">{formError}</div>}
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Form>
        <div className="text-sm text-center">
          <p className="text-gray-600 dark:text-gray-300">Demo credentials:</p>
          <p className="text-gray-600 dark:text-gray-300">
            <strong>Admin:</strong> admin@example.com / 1234
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            <strong>User:</strong> user1@example.com / 1234
          </p>
        </div>
      </div>
    </div>
  )
}
