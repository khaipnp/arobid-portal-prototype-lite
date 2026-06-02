import { ImagePlusIcon, InfoIcon, SearchIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ExpoCategory, ExpoLayoutTemplate } from "@/lib/tradexpo/types";

type GeneralStepProps = {
  title: string;
  stepDescription: string;
  name: string;
  onNameChange: (value: string) => void;
  isSuper: boolean;
  isEdit: boolean;
  slug: string;
  onSlugChange: (value: string) => void;
  expoDescription: string;
  onExpoDescriptionChange: (value: string) => void;
  thumbnailUrl: string;
  onThumbnailUrlChange: (value: string) => void;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isPartnerContentEdit: boolean;
  expoTemplateId: string;
  onExpoTemplateIdChange: (value: string) => void;
  layoutTemplates: ExpoLayoutTemplate[];
  categoryQuery: string;
  onCategoryQueryChange: (value: string) => void;
  filteredCategories: ExpoCategory[];
  categoryIds: string[];
  onToggleCategory: (id: string) => void;
};

export function GeneralStep({
  title,
  stepDescription,
  name,
  onNameChange,
  isSuper,
  isEdit,
  slug,
  onSlugChange,
  expoDescription,
  onExpoDescriptionChange,
  thumbnailUrl,
  onThumbnailUrlChange,
  isUploading,
  fileInputRef,
  onFileChange,
  isPartnerContentEdit,
  expoTemplateId,
  onExpoTemplateIdChange,
  layoutTemplates,
  categoryQuery,
  onCategoryQueryChange,
  filteredCategories,
  categoryIds,
  onToggleCategory,
}: GeneralStepProps) {
  function openFilePicker() {
    fileInputRef.current?.click();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-semibold text-xl leading-none">{title}</h2>
        <p className="text-muted-foreground text-sm">{stepDescription}</p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="expo-name" className="capitalize">
            Expo name
          </Label>
          <Input
            id="expo-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            maxLength={255}
            required
            placeholder="Unique name"
          />
        </div>
        {isSuper && isEdit ? (
          <div className="grid gap-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="expo-slug">Slug</Label>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="size-3" strokeWidth="1.5" />
                </TooltipTrigger>
                <TooltipContent>
                  Lowercase letters, numbers, and single hyphens only.
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="expo-slug"
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              placeholder="expo-url-slug"
            />
          </div>
        ) : null}
        <div className="grid gap-2">
          <Label htmlFor="expo-desc">Description</Label>
          <Textarea
            id="expo-desc"
            value={expoDescription}
            onChange={(e) => onExpoDescriptionChange(e.target.value)}
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
                  onClick={() => onThumbnailUrlChange("")}
                >
                  <Trash2Icon />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="flex aspect-video w-full max-w-md cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-muted/30 transition-colors hover:bg-muted/50"
                onClick={openFilePicker}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openFilePicker();
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
              onChange={onFileChange}
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
              onValueChange={onExpoTemplateIdChange}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select layout template" />
              </SelectTrigger>
              <SelectContent>
                {layoutTemplates.map((t) => (
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
              onChange={(e) => onCategoryQueryChange(e.target.value)}
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
                  onCheckedChange={() => onToggleCategory(cat.id)}
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
      </div>
    </div>
  );
}
