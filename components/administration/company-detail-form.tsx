"use client"

import { ImagePlusIcon, Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useUpload } from "@/hooks/use-upload"
import type { AdministrationCompanyDetail } from "@/lib/administration/company-detail"
import type { CompanyCategoryOption } from "@/lib/administration/types"

interface CompanyDetailFormProps {
  company: AdministrationCompanyDetail
  categories: CompanyCategoryOption[]
}

function getCompanyInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  return initials || "—"
}

export function CompanyDetailForm({
  company,
  categories
}: CompanyDetailFormProps) {
  const router = useRouter()
  const { uploadFile, isUploading } = useUpload()
  const logoInputRef = React.useRef<HTMLInputElement>(null)
  const [name, setName] = React.useState(company.name)
  const [taxId, setTaxId] = React.useState(company.taxId ?? "")
  const [website, setWebsite] = React.useState(company.website ?? "")
  const [address, setAddress] = React.useState(company.address ?? "")
  const [logoUrl, setLogoUrl] = React.useState(company.logoUrl ?? "")
  const [isActive, setIsActive] = React.useState(company.isActive)
  const [representativeUserId, setRepresentativeUserId] = React.useState(
    company.representativeUserId ?? "none"
  )
  const [categoryIds, setCategoryIds] = React.useState<string[]>(
    company.categoryIds
  )
  const [submitting, setSubmitting] = React.useState(false)

  async function handleLogoFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0]
    if (!file) return

    const result = await uploadFile(file, "image")
    if (result) {
      setLogoUrl(result.fileUrl)
    }
    event.target.value = ""
  }

  function handleCategoryToggle(categoryId: string, checked: boolean) {
    setCategoryIds((current) => {
      if (checked) return Array.from(new Set([...current, categoryId]))
      return current.filter((id) => id !== categoryId)
    })
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch(
        `/api/admin/administration/companies/${encodeURIComponent(company.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            taxId,
            website,
            address,
            logoUrl,
            isActive,
            representativeUserId:
              representativeUserId === "none" ? null : representativeUserId,
            categoryIds
          })
        }
      )
      const payload = (await response.json()) as {
        ok?: boolean
        error?: string
      }

      if (!response.ok) {
        toast.error(payload.error ?? "Could not save company.")
        return
      }

      toast.success("Company detail saved.")
      router.refresh()
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="admin-company-id">Company ID</Label>
          <Input
            id="admin-company-id"
            value={company.id}
            readOnly
            className="bg-muted font-mono text-xs"
          />
        </div>

        <TextField
          id="admin-company-name"
          label="Company name"
          value={name}
          onChange={setName}
          required
        />
        <TextField
          id="admin-company-tax-id"
          label="Tax ID"
          value={taxId}
          onChange={setTaxId}
        />
        <TextField
          id="admin-company-website"
          label="Website"
          value={website}
          onChange={setWebsite}
          type="url"
        />
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="admin-company-address">Address</Label>
          <Textarea
            id="admin-company-address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="admin-company-representative">Representative</Label>
          <Select
            value={representativeUserId}
            onValueChange={setRepresentativeUserId}
          >
            <SelectTrigger id="admin-company-representative">
              <SelectValue placeholder="Select company representative" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No representative</SelectItem>
              {company.userAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} · {account.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">
            Representative must be an account that belongs to this company.
          </p>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Logo</Label>
          <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center">
            <Avatar className="size-20" size="lg">
              {logoUrl ? (
                <AvatarImage src={logoUrl} alt={`${name || "Company"} logo`} />
              ) : null}
              <AvatarFallback>{getCompanyInitials(name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => logoInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Spinner />
                ) : (
                  <ImagePlusIcon className="size-4" />
                )}
                Upload logo
              </Button>
              {logoUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setLogoUrl("")}
                  disabled={isUploading}
                >
                  <Trash2Icon className="size-4" />
                  Remove
                </Button>
              ) : null}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoFileChange}
                disabled={isUploading}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Industries</Label>
          <div className="grid max-h-72 gap-2 overflow-auto rounded-lg border p-3 sm:grid-cols-2">
            {categories.map((category) => {
              const checkboxId = `admin-company-category-${category.id}`
              return (
                <label
                  key={category.id}
                  htmlFor={checkboxId}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
                >
                  <Checkbox
                    id={checkboxId}
                    checked={categoryIds.includes(category.id)}
                    onCheckedChange={(checked) =>
                      handleCategoryToggle(category.id, checked === true)
                    }
                  />
                  <span className="text-sm">{category.name}</span>
                </label>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
        <div>
          <Label htmlFor="admin-company-active">Approved company</Label>
          <p className="text-muted-foreground text-xs">
            Pending companies stay hidden from active marketplace flows.
          </p>
        </div>
        <Switch
          id="admin-company-active"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting || isUploading}>
          {submitting ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  )
}

function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </div>
  )
}
