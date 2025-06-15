"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface VerifyEncryptionDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  mode: "client" | "server"
}

export function VerifyEncryptionDialog({ open, onConfirm, onCancel, mode }: VerifyEncryptionDialogProps) {
  const [loading, setLoading] = useState(false)

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) onCancel() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Encryption Mode Change</DialogTitle>
          <DialogDescription>
            Are you sure you want to switch to <b>{mode}</b>-side encryption? You may be asked to re-authenticate for security.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button onClick={() => { setLoading(true); onConfirm(); }} disabled={loading}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
