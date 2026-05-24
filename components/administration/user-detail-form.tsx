"use client";

import { ImagePlusIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useUpload } from "@/hooks/use-upload";
import type { AdministrationUserDetail } from "@/lib/administration/user-detail";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";

type EditableUserFields = Pick<
  AdministrationUserDetail,
  | "id"
  | "name"
  | "email"
  | "companyId"
  | "companyName"
  | "jobTitle"
  | "phone"
  | "website"
  | "location"
  | "avatarUrl"
  | "isActive"
>;

export function UserDetailForm({ user }: { user: EditableUserFields }) {
  const router = useRouter();
  const [userId, setUserId] = React.useState(user.id);
  const [name, setName] = React.useState(user.name);
  const [email, setEmail] = React.useState(user.email);
  const [companyId, setCompanyId] = React.useState(user.companyId ?? "");
  const [companyName, setCompanyName] = React.useState(user.companyName ?? "");
  const [jobTitle, setJobTitle] = React.useState(user.jobTitle ?? "");
  const [phone, setPhone] = React.useState(user.phone ?? "");
  const [website, setWebsite] = React.useState(user.website ?? "");
  const [location, setLocation] = React.useState(user.location ?? "");
  const [avatarUrl, setAvatarUrl] = React.useState(user.avatarUrl ?? "");
  const [isActive, setIsActive] = React.useState(user.isActive);
  const { uploadFile, isUploading } = useUpload();
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [notice, setNotice] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleAvatarFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await uploadFile(file, "avatar");
    if (result) {
      setAvatarUrl(result.fileUrl);
    }
    event.target.value = "";
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setNotice(null);

    try {
      const response = await fetch(
        `/api/admin/administration/users/${encodeURIComponent(user.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            name,
            email,
            companyId,
            companyName,
            jobTitle,
            phone,
            website,
            location,
            avatarUrl,
            isActive,
          }),
        },
      );
      const payload = (await response.json()) as {
        ok?: boolean;
        user?: { id: string };
        error?: string;
      };
      if (!response.ok) {
        toast.error(payload.error ?? "Could not save user.");
        return;
      }

      const nextUserId = payload.user?.id ?? userId;
      toast.success("User detail saved.");
      if (nextUserId !== user.id) {
        router.replace(`/admin/administration/users/${nextUserId}`);
      }
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);

    try {
      const response = await fetch(
        `/api/admin/administration/users/${encodeURIComponent(user.id)}`,
        { method: "DELETE" },
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(payload.error ?? "Could not delete user.");
        return;
      }

      toast.success("User deleted.");
      router.replace("/admin/administration/users");
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="admin-user-id">User ID</Label>
          <InputGroup>
            <InputGroupInput
              id="admin-user-id"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              className="font-mono text-xs"
              required
            />
            <InputGroupAddon align="inline-end">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setUserId(crypto.randomUUID())}
              >
                <RefreshCwIcon />
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <TextField
          id="admin-user-name"
          label="Name"
          value={name}
          onChange={setName}
          required
        />
        <TextField
          id="admin-user-email"
          label="Email"
          value={email}
          onChange={setEmail}
          type="email"
          required
        />
        <TextField
          id="admin-user-company-id"
          label="Company ID"
          value={companyId}
          onChange={setCompanyId}
        />
        <TextField
          id="admin-user-company"
          label="Company"
          value={companyName}
          onChange={setCompanyName}
        />
        <TextField
          id="admin-user-job-title"
          label="Job title"
          value={jobTitle}
          onChange={setJobTitle}
        />
        <TextField
          id="admin-user-phone"
          label="Phone"
          value={phone}
          onChange={setPhone}
        />
        <TextField
          id="admin-user-location"
          label="Location"
          value={location}
          onChange={setLocation}
        />
        <TextField
          id="admin-user-website"
          label="Website"
          value={website}
          onChange={setWebsite}
        />
        <div className="space-y-2 sm:col-span-2">
          <Label>Avatar</Label>
          <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center">
            <div className="grid size-20 place-items-center overflow-hidden rounded-full bg-muted">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={`${name || "User"} avatar`}
                  width={80}
                  height={80}
                  className="size-full object-cover"
                />
              ) : (
                <ImagePlusIcon className="size-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Spinner />
                ) : (
                  <ImagePlusIcon className="mr-1 size-4" />
                )}
                Upload avatar
              </Button>
              {avatarUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAvatarUrl("")}
                  disabled={isUploading}
                >
                  <Trash2Icon className="size-4" />
                  Remove
                </Button>
              ) : null}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
                disabled={isUploading}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
        <div>
          <Label htmlFor="admin-user-active">Active account</Label>
          <p className="text-muted-foreground text-xs">
            Inactive users cannot sign in.
          </p>
        </div>
        <Switch
          id="admin-user-active"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
      </div>

      {notice ? (
        <p
          className={
            notice.type === "success"
              ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-900 text-sm dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
              : "rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-800 text-sm dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200"
          }
        >
          {notice.text}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-between gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" disabled={deleting}>
              Delete user
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete user?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {user.name} and related access
                records. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={deleting}
                onClick={(event) => {
                  event.preventDefault();
                  void handleDelete();
                }}
              >
                {deleting ? "Deleting..." : "Delete user"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
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
  );
}
