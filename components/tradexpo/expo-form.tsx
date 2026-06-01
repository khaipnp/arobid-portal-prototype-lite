"use client";

import {
  BadgeCheckIcon,
  GemIcon,
  ImagePlusIcon,
  PlusIcon,
  RocketIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useUpload } from "@/hooks/use-upload";
import {
  EXPO_FORM_TIMEZONES,
  toDatetimeLocalValue,
} from "@/lib/tradexpo/expo-form-utils";
import {
  DEFAULT_EXPO_MARKETING_CONTENT,
  normalizeExpoMarketingContent,
  validateExpoMarketingContent,
} from "@/lib/tradexpo/expo-marketing-content";
import {
  confirmOwnerChange,
  getOwnerDisplay,
} from "@/lib/tradexpo/expo-owner-flow";
import {
  EXPO_MONTH_OPTIONS,
  getExpoSchedulePrecision,
  normalizeExpoScheduleInput,
} from "@/lib/tradexpo/schedule";
import type {
  Expo,
  ExpoCategory,
  ExpoHall,
  ExpoLayoutTemplate,
  ExpoMarketingContent,
  ExpoMarketingIconKey,
  ExpoSchedulePrecision,
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

type AudienceCardFormRow =
  ExpoMarketingContent["whoShouldJoin"]["audienceCards"][number] & {
    key: string;
  };

type BenefitCardFormRow =
  ExpoMarketingContent["audienceBenefits"]["benefitCards"][number] & {
    key: string;
  };

const MARKETING_ICON_OPTIONS: Array<{
  value: ExpoMarketingIconKey;
  label: string;
  Icon: typeof BadgeCheckIcon;
}> = [
  { value: "badge", label: "Badge", Icon: BadgeCheckIcon },
  { value: "rocket", label: "Rocket", Icon: RocketIcon },
  { value: "gem", label: "Gem", Icon: GemIcon },
];

const SCHEDULE_PRECISION_OPTIONS: Array<{
  value: ExpoSchedulePrecision;
  label: string;
  description: string;
}> = [
  {
    value: "exact_date_range",
    label: "Exact date range",
    description: "Use confirmed start and end date/time.",
  },
  {
    value: "month_year",
    label: "Month & year",
    description: "Use event month and year while exact dates are pending.",
  },
  {
    value: "unscheduled",
    label: "To be announced",
    description: "Create this Expo without schedule fields.",
  },
];

function rowKey(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}

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

function audienceRowsFromContent(
  content: ExpoMarketingContent,
): AudienceCardFormRow[] {
  return content.whoShouldJoin.audienceCards.map((card) => ({
    ...card,
    key: rowKey("audience"),
  }));
}

function benefitRowsFromContent(
  content: ExpoMarketingContent,
): BenefitCardFormRow[] {
  return content.audienceBenefits.benefitCards.map((card) => ({
    ...card,
    key: rowKey("benefit"),
  }));
}

function newAudienceCard(): AudienceCardFormRow {
  return {
    key: rowKey("audience"),
    title: "",
    description: "",
    tags: [],
    displayOrder: 0,
  };
}

function newBenefitCard(): BenefitCardFormRow {
  return {
    key: rowKey("benefit"),
    audienceName: "",
    icon: "badge",
    benefitItems: [""],
    isFeatured: false,
    displayOrder: 0,
  };
}

export type ExpoFormProps = {
  categories: ExpoCategory[];
  layoutTemplates: ExpoLayoutTemplate[];
  hallTemplates: HallTemplate[];
  cancelHref?: string;
  successHref?: string;
  submitEndpoint?: string;
  editableScope?: "admin" | "partner-content";
  isSuper?: boolean;
  initialMarketingContent?: ExpoMarketingContent;
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
  const editableScope = props.editableScope ?? "admin";
  const isPartnerContentEdit = isEdit && editableScope === "partner-content";
  const isSuper = props.isSuper ?? false;

  const [name, setName] = React.useState(() =>
    isEdit ? props.initialExpo.name : "",
  );
  const [slug, setSlug] = React.useState(() =>
    isEdit ? (props.initialExpo.slug ?? "") : "",
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

  const [schedulePrecision, setSchedulePrecision] =
    React.useState<ExpoSchedulePrecision>(() =>
      isEdit ? getExpoSchedulePrecision(props.initialExpo) : "unscheduled",
    );
  const [scheduleMonth, setScheduleMonth] = React.useState(() =>
    isEdit && props.initialExpo.scheduleMonth
      ? String(props.initialExpo.scheduleMonth)
      : "",
  );
  const [scheduleYear, setScheduleYear] = React.useState(() =>
    isEdit && props.initialExpo.scheduleYear
      ? String(props.initialExpo.scheduleYear)
      : "",
  );
  const [scheduleError, setScheduleError] = React.useState<string | null>(null);

  const [startLocal, setStartLocal] = React.useState(() => {
    if (isEdit) {
      if (props.initialExpo.startAt) {
        return toDatetimeLocalValue(new Date(props.initialExpo.startAt));
      }
      if (props.initialExpo.startDate) {
        return toDatetimeLocalValue(
          new Date(`${props.initialExpo.startDate}T12:00:00`),
        );
      }
    }
    return "";
  });
  const [endLocal, setEndLocal] = React.useState(() => {
    if (isEdit) {
      if (props.initialExpo.endAt) {
        return toDatetimeLocalValue(new Date(props.initialExpo.endAt));
      }
      if (props.initialExpo.endDate) {
        return toDatetimeLocalValue(
          new Date(`${props.initialExpo.endDate}T12:00:00`),
        );
      }
    }
    return "";
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
  const [isChangingOwner, setIsChangingOwner] = React.useState(!isEdit);
  const [showOwnerChangeConfirm, setShowOwnerChangeConfirm] =
    React.useState(false);

  const initialMarketingContent = normalizeExpoMarketingContent(
    props.initialMarketingContent ?? DEFAULT_EXPO_MARKETING_CONTENT,
  );
  const [whoEnabled, setWhoEnabled] = React.useState(
    initialMarketingContent.whoShouldJoin.enabled,
  );
  const [whoTitle, setWhoTitle] = React.useState(
    initialMarketingContent.whoShouldJoin.sectionTitle,
  );
  const [whoSubtitle, setWhoSubtitle] = React.useState(
    initialMarketingContent.whoShouldJoin.sectionSubtitle ?? "",
  );
  const [audienceCards, setAudienceCards] = React.useState<
    AudienceCardFormRow[]
  >(() => audienceRowsFromContent(initialMarketingContent));
  const [benefitsEnabled, setBenefitsEnabled] = React.useState(
    initialMarketingContent.audienceBenefits.enabled,
  );
  const [benefitsTitle, setBenefitsTitle] = React.useState(
    initialMarketingContent.audienceBenefits.sectionTitle,
  );
  const [benefitsSubtitle, setBenefitsSubtitle] = React.useState(
    initialMarketingContent.audienceBenefits.sectionSubtitle ?? "",
  );
  const [benefitCards, setBenefitCards] = React.useState<BenefitCardFormRow[]>(
    () => benefitRowsFromContent(initialMarketingContent),
  );

  const [halls, setHalls] = React.useState<HallFormRow[]>(() =>
    isEdit ? hallsToRows(props.initialHalls) : [newHallRow(0)],
  );

  const { uploadFile, isUploading } = useUpload();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await uploadFile(file, "thumbnail");
    if (result) {
      setThumbnailUrl(result.fileUrl);
    }
  };

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

  function updateAudienceCard(
    index: number,
    patch: Partial<AudienceCardFormRow>,
  ) {
    setAudienceCards((prev) =>
      prev.map((card, i) => (i === index ? { ...card, ...patch } : card)),
    );
  }

  function updateBenefitCard(
    index: number,
    patch: Partial<BenefitCardFormRow>,
  ) {
    setBenefitCards((prev) =>
      prev.map((card, i) => {
        if (i !== index) {
          return patch.isFeatured ? { ...card, isFeatured: false } : card;
        }
        return { ...card, ...patch };
      }),
    );
  }

  function updateBenefitItem(
    cardIndex: number,
    itemIndex: number,
    value: string,
  ) {
    setBenefitCards((prev) =>
      prev.map((card, i) =>
        i === cardIndex
          ? {
              ...card,
              benefitItems: card.benefitItems.map((item, j) =>
                j === itemIndex ? value : item,
              ),
            }
          : card,
      ),
    );
  }

  function buildMarketingContent(): ExpoMarketingContent {
    return normalizeExpoMarketingContent({
      whoShouldJoin: {
        enabled: whoEnabled,
        sectionTitle: whoTitle,
        sectionSubtitle: whoSubtitle,
        audienceCards: audienceCards.map(({ key: _key, ...card }) => card),
      },
      audienceBenefits: {
        enabled: benefitsEnabled,
        sectionTitle: benefitsTitle,
        sectionSubtitle: benefitsSubtitle,
        benefitCards: benefitCards.map(({ key: _key, ...card }) => card),
      },
    });
  }

  function handleConfirmOwnerChange() {
    const next = confirmOwnerChange(ownerPick);
    setOwnerQuery(next.ownerQuery);
    setOwnerPick(next.ownerPick);
    setIsChangingOwner(next.isChangingOwner);
    setOwnerResults([]);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setScheduleError(null);
    if (!ownerPick) {
      setError("Search and select an expo owner by email.");
      return;
    }

    const scheduleResult = normalizeExpoScheduleInput({
      schedulePrecision,
      startAt: startLocal,
      endAt: endLocal,
      timezone,
      scheduleMonth,
      scheduleYear,
    });
    if (!scheduleResult.ok) {
      setScheduleError(scheduleResult.error);
      return;
    }
    const schedule = scheduleResult.schedule;

    const marketingContent = buildMarketingContent();
    const marketingResult = validateExpoMarketingContent(marketingContent);
    if (!marketingResult.ok) {
      setError(marketingResult.error);
      return;
    }

    const payload = {
      name,
      ...(isSuper ? { slug } : {}),
      description,
      thumbnailUrl,
      expoTemplateId,
      categoryIds,
      schedulePrecision: schedule.schedulePrecision,
      startAt: schedule.startAt,
      endAt: schedule.endAt,
      timezone: schedule.timezone,
      scheduleMonth: schedule.scheduleMonth,
      scheduleYear: schedule.scheduleYear,
      ownerUserId: ownerPick.id,
      ownerEmail: ownerPick.email,
      marketingContent,
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
        const res = await fetch(
          props.submitEndpoint ?? `/api/tradexpo/expos/${props.expoId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok) {
          setError(data.error ?? "Could not save expo.");
          return;
        }
        router.push(
          props.successHref ?? `/admin/tradexpo/expos/${props.expoId}`,
        );
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

  const hasScheduleInput =
    schedulePrecision === "exact_date_range"
      ? startLocal.trim().length > 0 && endLocal.trim().length > 0
      : schedulePrecision === "month_year"
        ? scheduleMonth.trim().length > 0 && scheduleYear.trim().length > 0
        : true;

  const canSubmit =
    name.trim().length > 0 &&
    description.trim().length > 0 &&
    expoTemplateId &&
    categoryIds.length > 0 &&
    ownerPick !== null &&
    hasScheduleInput;

  const cancelHref =
    props.cancelHref ??
    (isEdit
      ? `/admin/tradexpo/expos/${props.expoId}`
      : "/admin/tradexpo/expos");
  const currentOwnerDisplay = isEdit
    ? getOwnerDisplay(ownerPick, props.initialExpo.ownerEmail)
    : null;
  const filteredCategories = React.useMemo(() => {
    const q = categoryQuery.trim().toLowerCase();
    if (!q) return props.categories;
    return props.categories.filter((cat) => cat.name.toLowerCase().includes(q));
  }, [categoryQuery, props.categories]);

  return (
    <form className="mt-5 space-y-3" onSubmit={onSubmit}>
      <Tabs defaultValue="general" className="space-y-3">
        <TabsList>
          <TabsTrigger value="general">General Info</TabsTrigger>
          <TabsTrigger value="marketing">Marketing Content</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>
                {isPartnerContentEdit
                  ? "Expo information"
                  : "General information"}
              </CardTitle>
              <CardDescription />
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
              {isSuper && isEdit ? (
                <div className="grid gap-2">
                  <Label htmlFor="expo-slug">Slug</Label>
                  <Input
                    id="expo-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    placeholder="expo-url-slug"
                  />
                  <p className="text-muted-foreground text-xs">
                    Lowercase letters, numbers, and single hyphens only.
                  </p>
                </div>
              ) : null}
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
                <Label>Thumbnail</Label>
                <div className="flex flex-col gap-3">
                  {thumbnailUrl ? (
                    <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border bg-muted">
                      <Image
                        src={thumbnailUrl}
                        alt="Expo thumbnail preview"
                        fill
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-sm"
                        className="absolute top-2 right-2 opacity-80 hover:opacity-100"
                        onClick={() => setThumbnailUrl("")}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="flex aspect-video w-full max-w-md cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-muted/30 transition-colors hover:bg-muted/50"
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          fileInputRef.current?.click();
                        }
                      }}
                    >
                      {isUploading ? (
                        <Spinner />
                      ) : (
                        <>
                          <ImagePlusIcon className="size-8 text-muted-foreground" />
                          <p className="text-muted-foreground text-sm">
                            Click to upload 16:9 thumbnail
                          </p>
                        </>
                      )}
                    </button>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                  <p className="text-muted-foreground text-xs">
                    Recommended size: 1280x720 (16:9). JPG, PNG, or WEBP.
                  </p>
                </div>
              </div>
              {!isPartnerContentEdit ? (
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
              ) : null}
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
                <div className="max-h-48 overflow-y-auto rounded-lg border">
                  {filteredCategories.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-3 py-1.5 text-sm hover:bg-muted/60"
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

              <section className="space-y-3 rounded-lg border p-4">
                <div>
                  <h3 className="font-medium text-sm">Schedule</h3>
                  <p className="text-muted-foreground text-xs">
                    Choose how precise the Expo schedule is right now.
                  </p>
                </div>
                <RadioGroup
                  value={schedulePrecision}
                  onValueChange={(value) => {
                    setSchedulePrecision(value as ExpoSchedulePrecision);
                    setScheduleError(null);
                  }}
                  className="grid gap-3 md:grid-cols-3"
                >
                  {SCHEDULE_PRECISION_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer gap-3 rounded-2xl border p-3 text-sm transition-colors hover:bg-muted/60 has-[[data-state=checked]]:border-legend has-[[data-state=checked]]:bg-legend/5"
                    >
                      <RadioGroupItem value={option.value} className="mt-0.5" />
                      <span className="grid gap-1">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-muted-foreground text-xs">
                          {option.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>

                {schedulePrecision === "exact_date_range" ? (
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
                ) : null}

                {schedulePrecision === "month_year" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Month</Label>
                      <Select
                        value={scheduleMonth}
                        onValueChange={setScheduleMonth}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPO_MONTH_OPTIONS.map((month) => (
                            <SelectItem
                              key={month.value}
                              value={String(month.value)}
                            >
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="schedule-year">Year</Label>
                      <Input
                        id="schedule-year"
                        inputMode="numeric"
                        pattern="[0-9]{4}"
                        value={scheduleYear}
                        onChange={(e) => setScheduleYear(e.target.value)}
                        placeholder="2026"
                        required
                      />
                    </div>
                  </div>
                ) : null}

                {schedulePrecision === "unscheduled" ? (
                  <p className="rounded-md bg-muted/50 px-3 py-2 text-muted-foreground text-sm">
                    Schedule to be announced. You can add exact dates later from
                    Edit Expo.
                  </p>
                ) : null}

                {scheduleError ? (
                  <p className="text-destructive text-xs">{scheduleError}</p>
                ) : null}
              </section>
            </CardContent>
          </Card>

          {!isPartnerContentEdit ? (
            <Card>
              <CardHeader>
                <CardTitle>Expo owner</CardTitle>
                <CardDescription>
                  Changing owner requires confirmation, then selecting a new
                  user from search results.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isEdit && !isChangingOwner && currentOwnerDisplay ? (
                  <div className="flex flex-col gap-3 rounded-md border px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Current owner
                      </p>
                      <p>
                        <strong>{currentOwnerDisplay.label}</strong> (
                        {currentOwnerDisplay.email})
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowOwnerChangeConfirm(true)}
                    >
                      Change owner
                    </Button>
                  </div>
                ) : null}

                {isChangingOwner ? (
                  <>
                    {isEdit ? (
                      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 text-sm dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                        Owner change is pending. Search and select a new owner
                        before saving.
                      </p>
                    ) : null}
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
                      <p className="text-muted-foreground text-xs">
                        Searching…
                      </p>
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
                        Selected: <strong>{ownerPick.name}</strong> (
                        {ownerPick.email})
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
                  </>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {!isPartnerContentEdit ? (
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle>Hall configuration</CardTitle>
                  <CardDescription>
                    One or more halls: name, hall template, and booth tier
                    counts (Basic / Professional / Premium).
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addHall}
                >
                  <PlusIcon className="mr-1 size-4" />
                  Add hall
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {halls.map((hall, index) => (
                  <div
                    key={hall.key}
                    className="space-y-3 rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm">
                        Hall {index + 1}
                      </span>
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
                                basicQty:
                                  Number.parseInt(e.target.value, 10) || 0,
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
                                premiumQty:
                                  Number.parseInt(e.target.value, 10) || 0,
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
          ) : null}
        </TabsContent>

        <TabsContent value="marketing" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Marketing</CardTitle>
              <CardDescription>
                Configure public Expo Detail content. Exhibited Categories still
                come from selected Expo categories.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <section className="space-y-4 rounded-lg border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-medium text-sm">Who should join?</h3>
                    <p className="text-muted-foreground text-xs">
                      Add audience groups shown on Expo Detail.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={whoEnabled}
                      onCheckedChange={(v) => setWhoEnabled(Boolean(v))}
                    />
                    Enabled
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Section title</Label>
                    <Input
                      value={whoTitle}
                      onChange={(e) => setWhoTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Subtitle</Label>
                    <Input
                      value={whoSubtitle}
                      onChange={(e) => setWhoSubtitle(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  {audienceCards.map((card, index) => (
                    <div
                      key={card.key}
                      className="grid gap-3 rounded-md border p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm">
                          Audience {index + 1}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={audienceCards.length <= 1}
                          onClick={() =>
                            setAudienceCards((prev) =>
                              prev.filter((_, i) => i !== index),
                            )
                          }
                        >
                          <Trash2Icon />
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          value={card.title}
                          onChange={(e) =>
                            updateAudienceCard(index, { title: e.target.value })
                          }
                          placeholder="The Buyers"
                        />
                        <Input
                          value={card.tags.join(", ")}
                          onChange={(e) =>
                            updateAudienceCard(index, {
                              tags: e.target.value
                                .split(",")
                                .map((tag) => tag.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="Retailers, Distributors"
                        />
                      </div>
                      <Textarea
                        value={card.description}
                        onChange={(e) =>
                          updateAudienceCard(index, {
                            description: e.target.value,
                          })
                        }
                        rows={2}
                        placeholder="Describe why this group should join."
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={audienceCards.length >= 6}
                    onClick={() =>
                      setAudienceCards((prev) => [...prev, newAudienceCard()])
                    }
                  >
                    <PlusIcon className="mr-1 size-4" />
                    Add audience
                  </Button>
                </div>
              </section>

              <section className="space-y-4 rounded-lg border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-medium text-sm">
                      Giá trị đặc quyền từng đối tượng
                    </h3>
                    <p className="text-muted-foreground text-xs">
                      Benefit cards render without user-configured CTA.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={benefitsEnabled}
                      onCheckedChange={(v) => setBenefitsEnabled(Boolean(v))}
                    />
                    Enabled
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Section title</Label>
                    <Input
                      value={benefitsTitle}
                      onChange={(e) => setBenefitsTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Subtitle</Label>
                    <Input
                      value={benefitsSubtitle}
                      onChange={(e) => setBenefitsSubtitle(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  {benefitCards.map((card, cardIndex) => (
                    <div
                      key={card.key}
                      className="grid gap-3 rounded-md border p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm">
                          Benefit {cardIndex + 1}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={benefitCards.length <= 1}
                          onClick={() =>
                            setBenefitCards((prev) =>
                              prev.filter((_, i) => i !== cardIndex),
                            )
                          }
                        >
                          <Trash2Icon />
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto]">
                        <Input
                          value={card.audienceName}
                          onChange={(e) =>
                            updateBenefitCard(cardIndex, {
                              audienceName: e.target.value,
                            })
                          }
                          placeholder="Dành cho Buyers"
                        />
                        <Select
                          value={card.icon}
                          onValueChange={(value) =>
                            updateBenefitCard(cardIndex, {
                              icon: value as ExpoMarketingIconKey,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MARKETING_ICON_OPTIONS.map(
                              ({ value, label, Icon }) => (
                                <SelectItem key={value} value={value}>
                                  <span className="inline-flex items-center gap-2">
                                    <Icon className="size-4" />
                                    {label}
                                  </span>
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={card.isFeatured}
                            onCheckedChange={(v) =>
                              updateBenefitCard(cardIndex, {
                                isFeatured: Boolean(v),
                              })
                            }
                          />
                          Featured
                        </label>
                      </div>
                      <div className="space-y-2">
                        {card.benefitItems.map((item, itemIndex) => (
                          <div
                            key={`${card.key}-item-${item}`}
                            className="flex gap-2"
                          >
                            <Input
                              value={item}
                              onChange={(e) =>
                                updateBenefitItem(
                                  cardIndex,
                                  itemIndex,
                                  e.target.value,
                                )
                              }
                              placeholder="Benefit item"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              disabled={card.benefitItems.length <= 1}
                              onClick={() =>
                                updateBenefitCard(cardIndex, {
                                  benefitItems: card.benefitItems.filter(
                                    (_, i) => i !== itemIndex,
                                  ),
                                })
                              }
                            >
                              <Trash2Icon />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={card.benefitItems.length >= 8}
                          onClick={() =>
                            updateBenefitCard(cardIndex, {
                              benefitItems: [...card.benefitItems, ""],
                            })
                          }
                        >
                          <PlusIcon className="mr-1 size-4" />
                          Add benefit
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={benefitCards.length >= 6}
                    onClick={() =>
                      setBenefitCards((prev) => [...prev, newBenefitCard()])
                    }
                  >
                    <PlusIcon className="mr-1 size-4" />
                    Add benefit card
                  </Button>
                </div>
              </section>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={showOwnerChangeConfirm}
        onOpenChange={setShowOwnerChangeConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change expo owner?</AlertDialogTitle>
            <AlertDialogDescription>
              The current owner will be unassigned from this expo when you save.
              After confirming, select a new owner from search results before
              saving changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmOwnerChange}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
