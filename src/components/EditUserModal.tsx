"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useForm, Controller } from "react-hook-form"
import { User } from "@/lib/db/schema"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, parseISO } from "date-fns"

type EditUserModalProps = {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onSave: (updatedUser: Partial<User>) => void
}

export function EditUserModal({ isOpen, onClose, user, onSave }: EditUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<{
    name: string
    dateOfBirth: string
    salary: string
    phoneNumber: string
    address: string
  }>({
    defaultValues: {
      name: "",
      dateOfBirth: "",
      salary: "100",
      phoneNumber: "",
      address: "",
    },
  })

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || "",
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth : "",
        salary: user.salary ? user.salary : "100",
        phoneNumber: user.phoneNumber || "",
        address: user.address || "",
      })
    }
  }, [user, reset])

  if (!user) return null

  const onSubmit = async (data: { name: string; dateOfBirth: string; salary: string; phoneNumber: string; address: string }) => {
    setIsSubmitting(true)
    try {
      const updatedUser = {
        name: data.name,
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth : null,
        salary: data.salary ? data.salary : null,
        phoneNumber: data.phoneNumber || null,
        address: data.address || null,
      }
      await onSave(updatedUser)
      toast.success("User updated!", { duration: 2000 })
      onClose()
    } catch (error: any) {
      const errorMsg = error?.message || "Failed to update user"
      toast.error(errorMsg, { duration: 3000 })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md animate-fadeIn animate-duration-400 animate-ease-in-out">
        <DialogHeader>
          <DialogTitle className="animate-fadeIn animate-duration-400">Edit User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              type="text"
              id="name"
              {...register("name", { required: true })}
              disabled={isSubmitting}
            />
            {errors.name && <span className="text-sm text-red-500">Name is required</span>}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input type="email" id="email" name="email" value={user.email} disabled />
          </div>
          <div>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Controller
              name="dateOfBirth"
              control={control}
              rules={{ required: true }}
              render={({ field }) => {
                const value = field.value
                const date = value ? parseISO(value) : undefined
                return (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={
                          !date
                            ? "text-muted-foreground w-full justify-start"
                            : "w-full justify-start"
                        }
                        type="button"
                        disabled={isSubmitting}
                      >
                        {date ? format(date, "yyyy-MM-dd") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        captionLayout="dropdown"
                        mode="single"
                        selected={date}
                        onSelect={(selected) => {
                          if (selected) field.onChange(format(selected, "yyyy-MM-dd"))
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )
              }}
            />
            {errors.dateOfBirth && (
              <span className="text-sm text-red-500">Date of Birth is required</span>
            )}
          </div>
          <div>
            <Label htmlFor="salary">Salary</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="number"
                id="salary"
                {...register("salary", { required: true })}
                placeholder="100"
                min="100"
                step="1"
                disabled={isSubmitting}
                className="pl-7"
              />
            </div>
            {errors.salary && <span className="text-sm text-red-500">Salary is required</span>}
          </div>
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              type="tel"
              id="phoneNumber"
              {...register("phoneNumber")}
              placeholder="Enter phone number"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              type="text"
              id="address"
              {...register("address")}
              placeholder="Enter address"
              disabled={isSubmitting}
            />
          </div>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="transition-transform duration-200 hover:scale-105 animate-fadeIn animate-duration-400"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="relative transition-transform duration-200 hover:scale-105 animate-fadeIn animate-duration-400"
            >
              {isSubmitting ? <span className="animate-pulse">Saving...</span> : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
