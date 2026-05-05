"use client";

import { PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  EXPO_FORM_TIMEZONES,
  toDatetimeLocalValue,
} from "@/lib/tradexpo/expo-form-utils";
import type {
  Expo,
  ExpoCategory,
  ExpoHall,
  ExpoLayoutTemplate,
  HallTemplate,
} from "@/lib/tradexpo/types";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { Spinner } from "../ui/spinner";

type HallFormRow = {
  key: string;
  hallName: string;
  hallTemplateId: string;
  basicQty: number;
  professionalQty: number;
  premiumQty: number;
};

type OwnerPick = { id: string; email: string; name: string };

function newHallRow(index: number): HallFormRow {
  return {
    key: `hall-${Math.random().toString(36).slice(2)}`,
    hallName: `Hall ${String.fromCharCode(65 + index)}`,
    hallTemplateId: "",
    basicQty: 0,
    professionalQty: 0,
    premiumQty: 0,
  };
}

function hallsToRows(halls: ExpoHall[]): HallFormRow[] {
  if (halls.length === 0) return [newHallRow(0)];
  return halls.map((h) => ({
    key: h.id,
    hallName: h.hallName,
    hallTemplateId: h.hallTemplateId,
    basicQty: h.basicQty,
    professionalQty: h.professionalQty,
    premiumQty: h.premiumQty,
  }));
}

export type ExpoFormProps = {
  categories: ExpoCategory[];
  layoutTemplates: ExpoLayoutTemplate[];
  hallTemplates: HallTemplate[];
} & (
  | { mode: "create" }
  | {
      mode: "edit";
      expoId: string;
      initialExpo: Expo;
      initialHalls: ExpoHall[];
      initialOwner: OwnerPick | null;
    }
);

export function ExpoForm(props: ExpoFormProps) {
  const router = useRouter();
  const isEdit = props.mode === "edit";

  const [name, setName] = React.useState(() =>
    isEdit ? props.initialExpo.name : "",
  );
  const [description, setDescription] = React.useState(() =>
    isEdit ? (props.initialExpo.description ?? "") : "",
  );
  const [thumbnailUrl, setThumbnailUrl] = React.useState(() =>
    isEdit ? props.initialExpo.thumbnailUrl : "",
  );
  const [expoTemplateId, setExpoTemplateId] = React.useState(() =>
    isEdit ? (props.initialExpo.expoTemplateId ?? "") : "",
  );
  const [categoryIds, setCategoryIds] = React.useState<string[]>(() =>
    isEdit ? props.initialExpo.categoryIds : [],
  );
  const [categoryQuery, setCategoryQuery] = React.useState("");
  const [timezone, setTimezone] = React.useState(() =>
    isEdit ? (props.initialExpo.timezone ?? "Asia/Bangkok") : "Asia/Bangkok",
  );

  const [startLocal, setStartLocal] = React.useState(() => {
    if (isEdit) {
      if (props.initialExpo.startAt) {
        return toDatetimeLocalValue(new Date(props.initialExpo.startAt));
      }
      return toDatetimeLocalValue(
        new Date(`${props.initialExpo.startDate}T12:00:00`),
      );
    }
    return toDatetimeLocalValue(new Date());
  });
  const [endLocal, setEndLocal] = React.useState(() => {
    if (isEdit) {
      if (props.initialExpo.endAt) {
        return toDatetimeLocalValue(new Date(props.initialExpo.endAt));
      }
      return toDatetimeLocalValue(
        new Date(`${props.initialExpo.endDate}T12:00:00`),
      );
    }
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return toDatetimeLocalValue(d);
  });

  const [ownerQuery, setOwnerQuery] = React.useState(() =>
    isEdit
      ? (props.initialOwner?.email ?? props.initialExpo.ownerEmail ?? "")
      : "",
  );
  const [ownerResults, setOwnerResults] = React.useState<OwnerPick[]>([]);
  const [ownerPick, setOwnerPick] = React.useState<OwnerPick | null>(() =>
    isEdit ? props.initialOwner : null,
  );
  const [ownerLoading, setOwnerLoading] = React.useState(false);

  const [halls, setHalls] = React.useState<HallFormRow[]>(() =>
    isEdit ? hallsToRows(props.initialHalls) : [newHallRow(0)],
  );

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const q = ownerQuery.trim();
    if (q.length < 2) {
      setOwnerResults([]);
      return;
    }
    const t = window.setTimeout(async () => {
      setOwnerLoading(true);
      try {
        const res = await fetch(
          `/api/tradexpo/expo-owners/search?q=${encodeURIComponent(q)}`,
        );
        const data = (await res.json()) as { users?: OwnerPick[] };
        setOwnerResults(data.users ?? []);
      } catch {
        setOwnerResults([]);
      } finally {
        setOwnerLoading(false);
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [ownerQuery]);

  function toggleCategory(id: string) {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function addHall() {
    setHalls((prev) => [...prev, newHallRow(prev.length)]);
  }

  function removeHall(index: number) {
    setHalls((prev) => prev.filter((_, i) => i !== index));
  }

  function updateHall(index: number, patch: Partial<HallFormRow>) {
    setHalls((prev) =>
      prev.map((h, i) => (i === index ? { ...h, ...patch } : h)),
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!ownerPick) {
      setError("Search and select an expo owner by email.");
      return;
    }

    const startAt = new Date(startLocal).toISOString();
    const endAt = new Date(endLocal).toISOString();

    const payload = {
      name,
      description,
      thumbnailUrl,
      expoTemplateId,
      categoryIds,
      startAt,
      endAt,
      timezone,
      ownerUserId: ownerPick.id,
      ownerEmail: ownerPick.email,
      halls: halls.map((h) => ({
        hallName: h.hallName,
        hallTemplateId: h.hallTemplateId,
        basicQty: h.basicQty,
        professionalQty: h.professionalQty,
        premiumQty: h.premiumQty,
      })),
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        const res = await fetch(`/api/tradexpo/expos/${props.expoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok) {
          setError(data.error ?? "Could not save expo.");
          return;
        }
        router.push(`/admin/tradexpo/expos/${props.expoId}`);
        router.refresh();
      } else {
        const res = await fetch("/api/tradexpo/expos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as { id?: string; error?: string };
        if (!res.ok) {
          setError(data.error ?? "Could not create expo.");
          return;
        }
        if (data.id) {
          router.push(`/admin/tradexpo/expos/${data.id}`);
          router.refresh();
        }
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    name.trim().length > 0 &&
    description.trim().length > 0 &&
    expoTemplateId &&
    categoryIds.length > 0 &&
    ownerPick !== null;

  const cancelHref = isEdit
    ? `/admin/tradexpo/expos/${props.expoId}`
    : "/admin/tradexpo/expos";
  const filteredCategories = React.useMemo(() => {
    const q = categoryQuery.trim().toLowerCase();
    if (!q) return props.categories;
    return props.categories.filter((cat) => cat.name.toLowerCase().includes(q));
  }, [categoryQuery, props.categories]);

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>General information</CardTitle>
          <CardDescription>
            {isEdit ? (
              <>
                Metadata, schedule, and template selection. Status stays{" "}
                <strong>{props.initialExpo.status}</strong> until you change it
                from the expo detail page.
              </>
            ) : (
              <>
                Metadata, schedule, and template selection. The expo is saved as{" "}
                <strong>Draft</strong>.
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="expo-name">Expo name</Label>
            <Input
              id="expo-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
              required
              placeholder="Unique name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="expo-desc">Description</Label>
            <Textarea
              id="expo-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              placeholder="What is this expo about?"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="thumb">Thumbnail URL (optional)</Label>
            <Input
              id="thumb"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://… (16:9 recommended)"
            />
            <p className="text-muted-foreground text-xs">
              JPG, PNG, or WEBP URL. If empty, a placeholder image is used.
            </p>
          </div>
          <div className="grid gap-2">
            <Label>Expo Template</Label>
            <Select
              value={expoTemplateId || undefined}
              onValueChange={setExpoTemplateId}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select layout template" />
              </SelectTrigger>
              <SelectContent>
                {props.layoutTemplates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Categories</Label>
            <InputGroup>
              <InputGroupInput
                value={categoryQuery}
                onChange={(e) => setCategoryQuery(e.target.value)}
                placeholder="Search categories..."
              />
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
            </InputGroup>
            <div className="max-h-48 overflow-y-auto rounded-md border">
              {filteredCategories.map((cat) => (
                <label
                  key={cat.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/60"
                >
                  <Checkbox
                    checked={categoryIds.includes(cat.id)}
                    onCheckedChange={() => toggleCategory(cat.id)}
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
              {filteredCategories.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No category matches your search.
                </p>
              ) : null}
            </div>
            {categoryIds.length === 0 ? (
              <p className="text-amber-600 text-xs">Select at least one.</p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="start">Start</Label>
              <Input
                id="start"
                type="datetime-local"
                value={startLocal}
                onChange={(e) => setStartLocal(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end">End</Label>
              <Input
                id="end"
                type="datetime-local"
                value={endLocal}
                onChange={(e) => setEndLocal(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPO_FORM_TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expo owner</CardTitle>
          <CardDescription>
            Search by email and select an existing account. Submit stays
            disabled until a user is selected.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="owner-q">Owner email</Label>
            <Input
              id="owner-q"
              value={ownerQuery}
              onChange={(e) => {
                setOwnerQuery(e.target.value);
                setOwnerPick(null);
              }}
              placeholder="Type at least 2 characters…"
              autoComplete="off"
            />
          </div>
          {ownerLoading ? (
            <p className="text-muted-foreground text-xs">Searching…</p>
          ) : null}
          {ownerResults.length > 0 && !ownerPick ? (
            <ul className="space-y-2">
              {ownerResults.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOwnerPick(u);
                      setOwnerQuery(u.email);
                    }}
                    className="w-full rounded-lg border bg-card px-3 py-2 text-left text-sm hover:bg-muted/50"
                  >
                    <span className="font-medium">{u.name}</span>
                    <span className="block text-muted-foreground">
                      {u.email}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {ownerQuery.trim().length >= 2 &&
          !ownerLoading &&
          ownerResults.length === 0 &&
          !ownerPick ? (
            <p className="text-amber-700 text-sm">
              No user found for that search.
            </p>
          ) : null}
          {ownerPick ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-900 dark:bg-emerald-950/40">
              Selected: <strong>{ownerPick.name}</strong> ({ownerPick.email})
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-2 h-7"
                onClick={() => {
                  setOwnerPick(null);
                  setOwnerQuery("");
                }}
              >
                Change
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div>
            <CardTitle>Hall configuration</CardTitle>
            <CardDescription>
              One or more halls: name, hall template, and booth tier counts
              (Basic / Professional / Premium).
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addHall}>
            <PlusIcon className="mr-1 size-4" />
            Add hall
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {halls.map((hall, index) => (
            <div key={hall.key} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm">Hall {index + 1}</span>
                {halls.length > 1 ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-sm"
                    onClick={() => removeHall(index)}
                    aria-label="Remove hall"
                  >
                    <Trash2Icon />
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Hall name</Label>
                  <Input
                    className="w-full"
                    value={hall.hallName}
                    onChange={(e) =>
                      updateHall(index, { hallName: e.target.value })
                    }
                    maxLength={100}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Hall template</Label>
                  <Select
                    value={hall.hallTemplateId || undefined}
                    onValueChange={(v) =>
                      updateHall(index, { hallTemplateId: v })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select hall template" />
                    </SelectTrigger>
                    <SelectContent>
                      {props.hallTemplates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {hall.hallTemplateId ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="grid gap-1">
                    <Label className="text-xs">Basic</Label>
                    <Input
                      type="number"
                      min={0}
                      value={hall.basicQty}
                      onChange={(e) =>
                        updateHall(index, {
                          basicQty: Number.parseInt(e.target.value, 10) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Professional</Label>
                    <Input
                      type="number"
                      min={0}
                      value={hall.professionalQty}
                      onChange={(e) =>
                        updateHall(index, {
                          professionalQty:
                            Number.parseInt(e.target.value, 10) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Premium</Label>
                    <Input
                      type="number"
                      min={0}
                      value={hall.premiumQty}
                      onChange={(e) =>
                        updateHall(index, {
                          premiumQty: Number.parseInt(e.target.value, 10) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Select a hall template to set booth tier quantities.
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {error ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-800 text-sm dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(cancelHref)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit || submitting}>
          {submitting ? <Spinner /> : null}
          {isEdit ? "Save changes" : "Create expo"}
        </Button>
      </div>
    </form>
  );
}
