"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  gender: "",
  mobile: "",
  dateOfBirth: "",
};

const UNSPECIFIED_GENDER = "__none__";

const GENDER_OPTIONS = [
  { value: UNSPECIFIED_GENDER, label: "Unspecified" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

type AccountProfileForm = typeof EMPTY_FORM;

type AccountProfileResponse = {
  profile?: Partial<AccountProfileForm> & {
    gender?: string | null;
    mobile?: string | null;
    dateOfBirth?: string | null;
  };
  error?: string;
};

type AccountProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function getErrorMessage(payload: AccountProfileResponse, fallback: string) {
  return payload.error?.trim() || fallback;
}

function toForm(
  profile: AccountProfileResponse["profile"],
): AccountProfileForm {
  return {
    firstName: profile?.firstName ?? "",
    lastName: profile?.lastName ?? "",
    gender: profile?.gender ?? "",
    mobile: profile?.mobile ?? "",
    dateOfBirth: profile?.dateOfBirth ?? "",
  };
}

export function AccountProfileDialog({
  open,
  onOpenChange,
}: AccountProfileDialogProps) {
  const router = useRouter();
  const [form, setForm] = React.useState<AccountProfileForm>(EMPTY_FORM);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setLoadError(null);

      try {
        const response = await fetch("/api/account/profile");
        const payload = (await response.json()) as AccountProfileResponse;

        if (!response.ok) {
          throw new Error(
            getErrorMessage(payload, "Failed to load account profile."),
          );
        }

        if (!cancelled) {
          setForm(toForm(payload.profile));
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load account profile.";
          setLoadError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [open]);

  function updateField(field: keyof AccountProfileForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          gender: form.gender || null,
          mobile: form.mobile || null,
          dateOfBirth: form.dateOfBirth || null,
        }),
      });
      const payload = (await response.json()) as AccountProfileResponse;

      if (!response.ok) {
        throw new Error(
          getErrorMessage(payload, "Failed to save account profile."),
        );
      }

      toast.success("Account profile saved.");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save account profile.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const saveDisabled = loading || submitting || Boolean(loadError);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Account information</DialogTitle>
          <DialogDescription>
            Update your personal information.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {loading ? (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-muted-foreground text-sm">
              <Spinner />
              Loading account profile...
            </div>
          ) : null}

          {loadError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm">
              {loadError}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="account-first-name">First Name</Label>
              <Input
                id="account-first-name"
                required
                disabled={loading || submitting}
                value={form.firstName}
                onChange={(event) =>
                  updateField("firstName", event.target.value)
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="account-last-name">Last Name</Label>
              <Input
                id="account-last-name"
                required
                disabled={loading || submitting}
                value={form.lastName}
                onChange={(event) =>
                  updateField("lastName", event.target.value)
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="account-gender">Gender</Label>
              <Select
                disabled={loading || submitting}
                value={form.gender || UNSPECIFIED_GENDER}
                onValueChange={(value) =>
                  updateField(
                    "gender",
                    value === UNSPECIFIED_GENDER ? "" : value,
                  )
                }
              >
                <SelectTrigger id="account-gender" className="w-full">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="account-mobile">Mobile</Label>
              <Input
                id="account-mobile"
                type="tel"
                disabled={loading || submitting}
                value={form.mobile}
                onChange={(event) => updateField("mobile", event.target.value)}
              />
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="account-date-of-birth">DoB</Label>
              <Input
                id="account-date-of-birth"
                type="date"
                disabled={loading || submitting}
                value={form.dateOfBirth}
                onChange={(event) =>
                  updateField("dateOfBirth", event.target.value)
                }
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={submitting}
              >
                Cancel
              </Button>
            </DialogClose>

            <Button type="submit" disabled={saveDisabled} size="lg">
              {submitting ? <Spinner /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
