"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { User } from "@/lib/db/schema"
import { Button } from "@/components/ui/button"
import { EditUserModal } from "@/components/EditUserModal"
import { ModeToggle } from "@/components/ModeToggle"
import { Switch } from "@/components/ui/switch"
import { VerifyEncryptionDialog } from "@/components/VerifyEncryptionDialog"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@radix-ui/react-label"
import { RSA } from "@/lib/rsa"
const rsa = new RSA()

export default function Dashboard() {
  const router = useRouter()

  const [encryptionMode, setEncryptionMode] = useState<"client" | "server">("server")
  const [pendingMode, setPendingMode] = useState<"client" | "server" | null>(null)
  const [clientSideEncryption, setClientSideEncryption] = useState(encryptionMode === "client")
  const [dialogOpen, setDialogOpen] = useState(false)

  const [user, setUser] = useState<User | null>(null)
  const [allRawUsers, setAllUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    async function decryptUser() {
      if (clientSideEncryption && user) {
        console.log("rsa.privateKey", rsa.privateKey, user.dateOfBirth)
        const dateOfBirth = await rsa.decryptWithPrivateKey(rsa.privateKey!, user?.dateOfBirth!)
        console.log("🚀 ~ decryptUser ~ dateOfBirth:", dateOfBirth)
      }
    }
    decryptUser()
  }, [user, clientSideEncryption])

  const allUsers = useMemo(async () => {
    if (!allRawUsers) return []
    if (!clientSideEncryption) return allRawUsers
    // const privateKey = localStorage.getItem("privateKey")
    // if (!privateKey) return allRawUsers
    // const basicEncryptUser = new BasicEncryptUser()
    // const decryptedUsers = allRawUsers.map((user) => basicEncryptUser.decodeSensitiveFields(user))
    // return decryptedUsers
    return allRawUsers
  }, [allRawUsers, clientSideEncryption])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    fetchMe().catch((e) => {
      console.error("Error fetching user:", e)
      router.push("/login")
    })
    fetchAllUsers()
  }, [router])

  const handleEncryptionModeChange = (mode: "client" | "server") => {
    setPendingMode(mode)
    setDialogOpen(true)
  }

  const handleDialogConfirm = async () => {
    if (!pendingMode) return
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ encryptionMode: pendingMode }),
      })
      if (!response.ok) throw new Error("Failed to update encryption mode")

      setEncryptionMode(pendingMode)
      if (typeof window !== "undefined") {
        localStorage.setItem("encryptionMode", pendingMode)
      }
      setDialogOpen(false)
      setPendingMode(null)
      // reload the page
      window.location.reload()
    } catch (e) {
      setDialogOpen(false)
      setPendingMode(null)
      alert("Failed to update encryption mode")
    }
  }

  const handleDialogCancel = () => {
    setDialogOpen(false)
    setPendingMode(null)
  }

  async function fetchMe() {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    const response = await fetch("/api/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const result = await response.json()
    if (!response.ok) {
      router.push("/login")
      return
    }
    let parsedUser = result.data

    if (parsedUser.encryptionMode === "client") {
      await rsa.generateKeyPair()
      console.log("rsa", rsa.privateKey)
      const publicKey = await rsa.exportPublicKeyToPEM()
      const response = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
        method: "POST",
        body: JSON.stringify({ publicKey }),
      })
      const result = await response.json()
      if (!response.ok) {
        router.push("/login")
        return
      }

      const response2 = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result2 = await response2.json()
      if (!response2.ok) {
        router.push("/login")
        return
      }
      parsedUser = result2.data
    }

    setUser(parsedUser)
    setEncryptionMode(parsedUser.encryptionMode)
  }

  const fetchAllUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const result = await response.json()

      if (result.success) setAllUsers(result.data)
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    fetch("/api/me", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).finally(() => {
      localStorage.removeItem("token")
      router.push("/login")
    })
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleSaveUser = async (updatedUser: Partial<User>) => {
    try {
      const response = await fetch(`/api/users/${selectedUser?.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updatedUser),
      })

      if (!response.ok) {
        throw new Error("Failed to update user")
      }

      // Refresh users list
      await fetchAllUsers()

      // If the updated user is the current user, update the user state
      if (selectedUser?.id === user?.id) {
        const updatedCurrentUser = {
          ...user,
          ...updatedUser,
          decryptedDateOfBirth: updatedUser.dateOfBirth ? updatedUser.dateOfBirth : undefined,
          decryptedSalary: updatedUser.salary
            ? `$${parseInt(updatedUser.salary).toLocaleString()}`
            : undefined,
        }
        setUser(updatedCurrentUser as User)
      }
    } catch (error) {
      console.error("Error updating user:", error)
      throw error
    }
  }

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <nav className="bg-white dark:bg-gray-950 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Select
                  value={encryptionMode}
                  onValueChange={(value) => {
                    if (value !== encryptionMode)
                      handleEncryptionModeChange(value as "client" | "server")
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select encryption mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="server">Server-side Encryption</SelectItem>
                    <SelectItem value="client">Client-side Encryption</SelectItem>
                  </SelectContent>
                </Select>
                <VerifyEncryptionDialog
                  open={dialogOpen}
                  onConfirm={handleDialogConfirm}
                  onCancel={handleDialogCancel}
                  mode={pendingMode || encryptionMode}
                />

                {encryptionMode === "client" && (
                  <>
                    <Switch
                      id="client-side-encryption"
                      checked={clientSideEncryption}
                      onCheckedChange={(checked) => {
                        setClientSideEncryption(checked)
                      }}
                      aria-label="Toggle client-side encryption"
                      className="mr-2"
                    />
                    <Label htmlFor="client-side-encryption"> Client-side Encryption</Label>
                  </>
                )}
              </div>
              <ModeToggle />
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-8">
        {/* User Profile Section */}
        <div className="px-4 sm:px-0">
          <div className="bg-white dark:bg-gray-950 overflow-hidden shadow rounded-lg divide-y divide-gray-200 dark:divide-gray-800 transition-colors">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                User Profile
              </h2>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-gray-200 dark:sm:divide-gray-800">
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
                    {user.name}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
                    {user.email}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Phone Number
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
                    {user.phoneNumber || "N/A"}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
                    {user.address || "N/A"}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Date of Birth
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
                    {user.dateOfBirth || "N/A"}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Salary</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
                    {user.salary || "N/A"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* All Users Table */}
        <div className="px-4 sm:px-0">
          <div className="bg-white dark:bg-gray-950 overflow-hidden shadow rounded-lg divide-y divide-gray-200 dark:divide-gray-800 transition-colors">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                All Users
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-900 transition-colors">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Phone Number
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Address
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Date of Birth
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Salary
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-200 dark:divide-gray-800 transition-colors">
                  {allUsers?.length > 0 ? (
                    allUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 group">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {user.phoneNumber || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {user.address || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {user.dateOfBirth || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {user.salary || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            disabled={!clientSideEncryption}
                            className="mr-4 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-300"
                      >
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <EditUserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
        onSave={async (updatedUser) => {
          await handleSaveUser(updatedUser)
          setIsModalOpen(false)
          setSelectedUser(null)
        }}
      />
    </div>
  )
}
