"use client";

/* eslint-disable @next/next/no-img-element */

import { MoreHorizontalIcon, PlusIcon, SearchIcon } from "lucide-react";
import * as React from "react";
import { StatusBadge } from "@/components/tradexpo/status-badge";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  mockAssets,
  mockBoothTemplates,
  mockBoothTemplateUsage,
  mockBoothTypes,
} from "@/lib/tradexpo/mock-data";
import type {
  BoothTemplate,
  BoothTemplateUsage,
  ModelAsset,
} from "@/lib/tradexpo/types";
import {
  canPublish,
  createMockId,
  formatDateTime,
  getAssetMap,
  getBoothTemplateStatus,
  getTranslationName,
  isValidFileName,
} from "@/lib/tradexpo/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";

interface BoothTemplateFormState {
  name: string;
  boothTypeId: string;
  description: string;
  glbFileName: string;
  thumbnailFileName: string;
  blendFileName: string;
  isPublic: boolean;
  isActive: boolean;
}

const defaultFormState: BoothTemplateFormState = {
  name: "",
  boothTypeId: "",
  description: "",
  glbFileName: "",
  thumbnailFileName: "",
  blendFileName: "",
  isPublic: false,
  isActive: true,
};

function cloneAssets() {
  return mockAssets.map((asset) => ({ ...asset }));
}

function cloneTemplates() {
  return mockBoothTemplates.map((template) => ({
    ...template,
    translations: template.translations.map((translation) => ({
      ...translation,
    })),
  }));
}

function cloneUsage() {
  return mockBoothTemplateUsage.map((usage) => ({ ...usage }));
}

export function BoothTemplateLibraryManager() {
  const [assets, setAssets] = React.useState<ModelAsset[]>(cloneAssets);
  const [templates, setTemplates] =
    React.useState<BoothTemplate[]>(cloneTemplates);
  const [usages, setUsages] = React.useState<BoothTemplateUsage[]>(cloneUsage);

  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);

  const [formOpen, setFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<"create" | "edit">("create");
  const [editingTemplateId, setEditingTemplateId] = React.useState<
    string | null
  >(null);
  const [formState, setFormState] =
    React.useState<BoothTemplateFormState>(defaultFormState);
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>(
    {},
  );

  const [notice, setNotice] = React.useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const [translationTemplateId, setTranslationTemplateId] = React.useState<
    string | null
  >(null);
  const [translationLanguageCode, setTranslationLanguageCode] =
    React.useState("vi");
  const [translationName, setTranslationName] = React.useState("");
  const [previewLocale, setPreviewLocale] = React.useState("en");
  const [deleteTemplateId, setDeleteTemplateId] = React.useState<string | null>(
    null,
  );

  const assetMap = React.useMemo(() => getAssetMap(assets), [assets]);

  const filteredTemplates = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return templates;
    }

    return templates.filter((template) =>
      template.name.toLowerCase().includes(keyword),
    );
  }, [templates, search]);

  const pageSize = 5;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTemplates.length / pageSize),
  );

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedTemplates = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTemplates.slice(start, start + pageSize);
  }, [filteredTemplates, page]);

  const translationTarget = React.useMemo(
    () => templates.find((template) => template.id === translationTemplateId),
    [templates, translationTemplateId],
  );

  const deleteTarget = React.useMemo(
    () => templates.find((template) => template.id === deleteTemplateId),
    [templates, deleteTemplateId],
  );

  const resetForm = React.useCallback(() => {
    setFormState(defaultFormState);
    setFormErrors({});
    setEditingTemplateId(null);
  }, []);

  const openCreateForm = React.useCallback(() => {
    resetForm();
    setFormMode("create");
    setFormOpen(true);
  }, [resetForm]);

  const openEditForm = React.useCallback((template: BoothTemplate) => {
    setFormMode("edit");
    setEditingTemplateId(template.id);
    setFormState({
      name: template.name,
      boothTypeId: template.boothTypeId,
      description: template.description,
      glbFileName: "",
      thumbnailFileName: "",
      blendFileName: "",
      isPublic: template.isPublic,
      isActive: template.isActive,
    });
    setFormErrors({});
    setFormOpen(true);
  }, []);

  const handleFormOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setFormOpen(nextOpen);

      if (!nextOpen) {
        resetForm();
      }
    },
    [resetForm],
  );

  const scheduleAssetProcessing = React.useCallback((asset: ModelAsset) => {
    window.setTimeout(() => {
      setAssets((currentAssets) =>
        currentAssets.map((item) =>
          item.id === asset.id ? { ...item, status: "processing" } : item,
        ),
      );
    }, 600);

    window.setTimeout(() => {
      const nextStatus = asset.fileName.toLowerCase().includes("fail")
        ? "failed"
        : "ready";

      setAssets((currentAssets) =>
        currentAssets.map((item) =>
          item.id === asset.id ? { ...item, status: nextStatus } : item,
        ),
      );
    }, 2100);
  }, []);

  function validateForm() {
    const nextErrors: Record<string, string> = {};
    const currentTemplate = templates.find(
      (template) => template.id === editingTemplateId,
    );

    const duplicateName = templates.some(
      (template) =>
        template.name.toLowerCase() === formState.name.trim().toLowerCase() &&
        template.id !== editingTemplateId,
    );

    if (!formState.name.trim()) {
      nextErrors.name = "Name is required";
    } else if (duplicateName) {
      nextErrors.name = "Name already exists";
    }

    if (!formState.boothTypeId) {
      nextErrors.boothTypeId = "Booth type is required";
    }

    const requiresGlb =
      formMode === "create" || !currentTemplate?.renderGlbAssetId;
    const requiresThumbnail =
      formMode === "create" || !currentTemplate?.thumbnailAssetId;

    if (requiresGlb && !formState.glbFileName.trim()) {
      nextErrors.glbFileName = "GLB file is required";
    }

    if (requiresThumbnail && !formState.thumbnailFileName.trim()) {
      nextErrors.thumbnailFileName = "Thumbnail is required";
    }

    if (
      formState.glbFileName.trim() &&
      !isValidFileName(formState.glbFileName, "glb")
    ) {
      nextErrors.glbFileName = "Only .glb format is accepted";
    }

    if (
      formState.thumbnailFileName.trim() &&
      !isValidFileName(formState.thumbnailFileName, "thumbnail")
    ) {
      nextErrors.thumbnailFileName = "Use JPG, PNG, or WEBP image format";
    }

    if (
      formState.blendFileName.trim() &&
      !isValidFileName(formState.blendFileName, "blend")
    ) {
      nextErrors.blendFileName = "Only .blend format is accepted";
    }

    if (formState.isPublic) {
      const willCreateNewRequiredAssets =
        Boolean(formState.glbFileName.trim()) ||
        Boolean(formState.thumbnailFileName.trim());

      if (willCreateNewRequiredAssets) {
        nextErrors.isPublic =
          "Cannot publish while required assets are still processing";
      } else if (currentTemplate && !canPublish(currentTemplate, assetMap)) {
        nextErrors.isPublic =
          "Cannot publish: required assets are not ready yet";
      }
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function buildAsset(fileName: string, kind: "blend" | "glb" | "thumbnail") {
    const id = createMockId("asset");

    return {
      id,
      fileName,
      kind,
      status: "pending" as const,
      fileUrl:
        kind === "blend"
          ? `https://example.com/files/${fileName}`
          : `https://picsum.photos/seed/${createMockId("preview")}/640/360`,
      createdAt: new Date().toISOString(),
    };
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const currentTemplate = templates.find(
      (template) => template.id === editingTemplateId,
    );

    const newAssets: ModelAsset[] = [];

    if (formState.glbFileName.trim()) {
      newAssets.push(buildAsset(formState.glbFileName.trim(), "glb"));
    }

    if (formState.thumbnailFileName.trim()) {
      newAssets.push(
        buildAsset(formState.thumbnailFileName.trim(), "thumbnail"),
      );
    }

    if (formState.blendFileName.trim()) {
      newAssets.push(buildAsset(formState.blendFileName.trim(), "blend"));
    }

    const newGlbAssetId =
      newAssets.find((asset) => asset.kind === "glb")?.id ||
      currentTemplate?.renderGlbAssetId;

    const newThumbnailAssetId =
      newAssets.find((asset) => asset.kind === "thumbnail")?.id ||
      currentTemplate?.thumbnailAssetId;

    if (!newGlbAssetId || !newThumbnailAssetId || !formState.boothTypeId) {
      setNotice({
        type: "error",
        text: "Missing required fields. Please verify booth type and required assets.",
      });
      return;
    }

    if (formMode === "create") {
      const nextTemplate: BoothTemplate = {
        id: createMockId("booth-template"),
        name: formState.name.trim(),
        translations: [],
        boothTypeId: formState.boothTypeId,
        sourceBlendAssetId:
          newAssets.find((asset) => asset.kind === "blend")?.id || undefined,
        renderGlbAssetId: newGlbAssetId,
        thumbnailAssetId: newThumbnailAssetId,
        description: formState.description.trim(),
        isPublic: false,
        isActive: formState.isActive,
        updatedBy: "Khai Pham",
        updatedAt: new Date().toISOString(),
      };

      setTemplates((currentTemplates) => [nextTemplate, ...currentTemplates]);
      setUsages((currentUsage) => [
        {
          boothTemplateId: nextTemplate.id,
          upcomingExpoBoothCount: 0,
          liveExpoBoothCount: 0,
          archivedExpoBoothCount: 0,
        },
        ...currentUsage,
      ]);
      setNotice({
        type: "success",
        text: "Booth template created. Required assets are processing.",
      });
    } else if (currentTemplate) {
      setTemplates((currentTemplates) =>
        currentTemplates.map((template) => {
          if (template.id !== currentTemplate.id) {
            return template;
          }

          return {
            ...template,
            name: formState.name.trim(),
            boothTypeId: formState.boothTypeId,
            description: formState.description.trim(),
            sourceBlendAssetId:
              newAssets.find((asset) => asset.kind === "blend")?.id ||
              template.sourceBlendAssetId,
            renderGlbAssetId: newGlbAssetId,
            thumbnailAssetId: newThumbnailAssetId,
            isPublic: formState.isPublic,
            isActive: formState.isActive,
            updatedBy: "Khai Pham",
            updatedAt: new Date().toISOString(),
          };
        }),
      );

      setNotice({
        type: "success",
        text: "Booth template updated successfully.",
      });
    }

    if (newAssets.length > 0) {
      setAssets((currentAssets) => [...newAssets, ...currentAssets]);
      newAssets.forEach((asset) => {
        scheduleAssetProcessing(asset);
      });
    }

    setFormOpen(false);
    resetForm();
  }

  function getUsage(templateId: string) {
    return usages.find((item) => item.boothTemplateId === templateId);
  }

  function handleTogglePublic(template: BoothTemplate) {
    const nextPublic = !template.isPublic;

    if (nextPublic && !canPublish(template, assetMap)) {
      setNotice({
        type: "error",
        text: "Cannot publish: required assets are not ready yet.",
      });
      return;
    }

    setTemplates((currentTemplates) =>
      currentTemplates.map((item) =>
        item.id === template.id
          ? {
              ...item,
              isPublic: nextPublic,
              updatedAt: new Date().toISOString(),
              updatedBy: "Khai Pham",
            }
          : item,
      ),
    );

    setNotice({
      type: "success",
      text: nextPublic
        ? "Template published for eligible booth types."
        : "Template moved back to draft.",
    });
  }

  function handleToggleActive(template: BoothTemplate) {
    const nextActive = !template.isActive;
    const usage = getUsage(template.id);

    setTemplates((currentTemplates) =>
      currentTemplates.map((item) =>
        item.id === template.id
          ? {
              ...item,
              isActive: nextActive,
              updatedAt: new Date().toISOString(),
              updatedBy: "Khai Pham",
            }
          : item,
      ),
    );

    if (!nextActive && (usage?.upcomingExpoBoothCount || 0) > 0) {
      setNotice({
        type: "info",
        text: `Template deactivated. Mock notification sent to ${usage?.upcomingExpoBoothCount} exhibitor(s).`,
      });
      return;
    }

    setNotice({
      type: "success",
      text: nextActive ? "Template re-activated." : "Template deactivated.",
    });
  }

  function handleDeleteTemplate(template: BoothTemplate) {
    const usage = getUsage(template.id);
    const totalReferences =
      (usage?.upcomingExpoBoothCount || 0) +
      (usage?.liveExpoBoothCount || 0) +
      (usage?.archivedExpoBoothCount || 0);

    if (totalReferences > 0) {
      setNotice({
        type: "error",
        text: "This template is used by one or more expo booths and cannot be deleted.",
      });
      return;
    }

    const nextTemplates = templates.filter((item) => item.id !== template.id);
    const removedAssetIds = [
      template.sourceBlendAssetId,
      template.renderGlbAssetId,
      template.thumbnailAssetId,
    ].filter(Boolean);

    setTemplates(nextTemplates);
    setUsages((currentUsage) =>
      currentUsage.filter((item) => item.boothTemplateId !== template.id),
    );

    setAssets((currentAssets) =>
      currentAssets.filter((asset) => {
        if (!removedAssetIds.includes(asset.id)) {
          return true;
        }

        return nextTemplates.some((candidate) =>
          [
            candidate.sourceBlendAssetId,
            candidate.renderGlbAssetId,
            candidate.thumbnailAssetId,
          ].includes(asset.id),
        );
      }),
    );

    if (translationTemplateId === template.id) {
      setTranslationTemplateId(null);
    }

    setNotice({
      type: "success",
      text: "Template and linked unused assets were deleted.",
    });
  }

  function handleAddTranslation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!translationTemplateId) {
      return;
    }

    const normalizedCode = translationLanguageCode.trim().toLowerCase();

    if (!normalizedCode || !translationName.trim()) {
      setNotice({
        type: "error",
        text: "Language code and translated name are required.",
      });
      return;
    }

    setTemplates((currentTemplates) =>
      currentTemplates.map((template) => {
        if (template.id !== translationTemplateId) {
          return template;
        }

        const existing = template.translations.find(
          (translation) =>
            translation.languageCode.toLowerCase() === normalizedCode,
        );

        if (existing) {
          return {
            ...template,
            translations: template.translations.map((translation) =>
              translation.languageCode.toLowerCase() === normalizedCode
                ? { ...translation, name: translationName.trim() }
                : translation,
            ),
            updatedAt: new Date().toISOString(),
            updatedBy: "Khai Pham",
          };
        }

        return {
          ...template,
          translations: [
            ...template.translations,
            { languageCode: normalizedCode, name: translationName.trim() },
          ],
          updatedAt: new Date().toISOString(),
          updatedBy: "Khai Pham",
        };
      }),
    );

    setTranslationName("");
    setNotice({ type: "success", text: "Translation saved." });
  }

  function handleDeleteTranslation(languageCode: string) {
    if (!translationTemplateId) {
      return;
    }

    setTemplates((currentTemplates) =>
      currentTemplates.map((template) => {
        if (template.id !== translationTemplateId) {
          return template;
        }

        return {
          ...template,
          translations: template.translations.filter(
            (translation) => translation.languageCode !== languageCode,
          ),
          updatedAt: new Date().toISOString(),
          updatedBy: "Khai Pham",
        };
      }),
    );

    setNotice({ type: "success", text: "Translation removed." });
  }

  return (
    <div className="grid gap-4">
      <section>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full items-center gap-2 md:max-w-xl">
            <InputGroup>
              <InputGroupInput
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search booth template by name"
              />
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
            </InputGroup>
            <Input
              className="w-28"
              value={previewLocale}
              onChange={(event) => setPreviewLocale(event.target.value || "en")}
              placeholder="locale"
            />
          </div>
          <Button onClick={openCreateForm}>
            <PlusIcon />
            Create New
          </Button>
        </div>

        {notice ? (
          <p
            className={
              notice.type === "error"
                ? "mt-3 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-rose-700 text-sm"
                : notice.type === "info"
                  ? "mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-700 text-sm"
                  : "mt-3 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-emerald-700 text-sm"
            }
          >
            {notice.text}
          </p>
        ) : null}

        <div className="mt-4 rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Thumbnail</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Booth Type</TableHead>
                <TableHead>Updated By</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedTemplates.length === 0 ? (
                <TableRow>
                  <TableCell className="py-5 text-muted-foreground" colSpan={7}>
                    No booth templates found.
                  </TableCell>
                </TableRow>
              ) : (
                pagedTemplates.map((template) => {
                  const status = getBoothTemplateStatus(template, assetMap);
                  const thumbnail = assetMap[template.thumbnailAssetId];
                  const translatedName = getTranslationName(
                    template.name,
                    template.translations,
                    previewLocale,
                  );
                  const boothTypeName =
                    mockBoothTypes.find(
                      (type) => type.id === template.boothTypeId,
                    )?.name || "Unknown";

                  return (
                    <TableRow key={template.id}>
                      <TableCell>
                        {/* biome-ignore lint/performance/noImgElement: thumbnail src is dynamic, next/image requires known dimensions */}
                        <img
                          src={thumbnail?.fileUrl}
                          alt={template.name}
                          className="h-12 w-20 rounded-md border object-cover"
                        />
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{translatedName}</p>
                        <p className="text-muted-foreground text-xs">
                          {template.description || "No description"}
                        </p>
                      </TableCell>
                      <TableCell>{boothTypeName}</TableCell>
                      <TableCell>{template.updatedBy}</TableCell>
                      <TableCell>
                        {formatDateTime(template.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={status} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon-sm" variant="ghost">
                              <MoreHorizontalIcon />
                              <span className="sr-only">Open actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onSelect={() => openEditForm(template)}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => handleTogglePublic(template)}
                            >
                              {template.isPublic ? "Unpublish" : "Publish"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => handleToggleActive(template)}
                            >
                              {template.isActive ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() =>
                                setTranslationTemplateId((currentId) =>
                                  currentId === template.id
                                    ? null
                                    : template.id,
                                )
                              }
                            >
                              {translationTemplateId === template.id
                                ? "Hide Translations"
                                : "Translations"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => setDeleteTemplateId(template.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} -{" "}
            {Math.min(page * pageSize, filteredTemplates.length)} of{" "}
            {filteredTemplates.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Previous
            </Button>
            <span>
              Page {page}/{totalPages}
            </span>
            <Button
              size="xs"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((value) => Math.min(totalPages, value + 1))
              }
            >
              Next
            </Button>
          </div>
        </div>
      </section>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTemplateId(null);
          }
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will remove booth template {deleteTarget?.name} and
              its linked unused assets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!deleteTarget) {
                  return;
                }

                handleDeleteTemplate(deleteTarget);
                setDeleteTemplateId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={formOpen} onOpenChange={handleFormOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {formMode === "create"
                ? "Create Booth Template"
                : "Edit Booth Template"}
            </DialogTitle>
            <DialogDescription>
              Required fields: Name, Booth Type, GLB render file, and thumbnail
              image.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-3" onSubmit={handleSave}>
            <div className="grid gap-1">
              <label className="font-medium text-sm">Name</label>
              <Input
                value={formState.name}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    name: event.target.value,
                  }))
                }
                placeholder="Minimal Basic Booth"
              />
              {formErrors.name ? (
                <p className="text-rose-600 text-xs">{formErrors.name}</p>
              ) : null}
            </div>

            <div className="grid gap-1">
              <label className="font-medium text-sm">Booth Type</label>
              <Select
                value={formState.boothTypeId}
                onValueChange={(value) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    boothTypeId: value,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select booth type" />
                </SelectTrigger>
                <SelectContent>
                  {mockBoothTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.boothTypeId ? (
                <p className="text-rose-600 text-xs">
                  {formErrors.boothTypeId}
                </p>
              ) : null}
            </div>

            <div className="grid gap-1">
              <label className="font-medium text-sm">Description</label>
              <Textarea
                value={formState.description}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    description: event.target.value,
                  }))
                }
                className="min-h-20"
                placeholder="Short description shown in booth picker"
              />
            </div>

            <div className="grid gap-1 md:grid-cols-2 md:gap-3">
              <div className="grid gap-1">
                <label className="font-medium text-sm">GLB Render File</label>
                <Input
                  value={formState.glbFileName}
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      glbFileName: event.target.value,
                    }))
                  }
                  placeholder="example.glb"
                />
                {formErrors.glbFileName ? (
                  <p className="text-rose-600 text-xs">
                    {formErrors.glbFileName}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Accepts .glb only
                  </p>
                )}
              </div>

              <div className="grid gap-1">
                <label className="font-medium text-sm">Thumbnail File</label>
                <Input
                  value={formState.thumbnailFileName}
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      thumbnailFileName: event.target.value,
                    }))
                  }
                  placeholder="example.png"
                />
                {formErrors.thumbnailFileName ? (
                  <p className="text-rose-600 text-xs">
                    {formErrors.thumbnailFileName}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Accepts JPG, PNG, WEBP
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-1">
              <label className="font-medium text-sm">
                Source Blender File (Optional)
              </label>
              <Input
                value={formState.blendFileName}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    blendFileName: event.target.value,
                  }))
                }
                placeholder="source.blend"
              />
              {formErrors.blendFileName ? (
                <p className="text-rose-600 text-xs">
                  {formErrors.blendFileName}
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Accepts .blend only
                </p>
              )}
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <Label className="flex items-center gap-2 rounded-md border p-2 text-sm">
                <Checkbox
                  checked={formState.isPublic}
                  onCheckedChange={(checked) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      isPublic: checked === true,
                    }))
                  }
                />
                Is Public
              </Label>
              <Label className="flex items-center gap-2 rounded-md border p-2 text-sm">
                <Checkbox
                  checked={formState.isActive}
                  onCheckedChange={(checked) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      isActive: checked === true,
                    }))
                  }
                />
                Is Active
              </Label>
            </div>

            {formErrors.isPublic ? (
              <p className="text-rose-600 text-xs">{formErrors.isPublic}</p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleFormOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {translationTarget ? (
        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold text-base">
            Translation Panel: {translationTarget.name}
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Add or update localized booth template names.
          </p>

          <form
            className="mt-4 grid gap-3 md:grid-cols-3"
            onSubmit={handleAddTranslation}
          >
            <Input
              value={translationLanguageCode}
              onChange={(event) =>
                setTranslationLanguageCode(event.target.value.toLowerCase())
              }
              placeholder="language code (vi, ja)"
            />
            <Input
              value={translationName}
              onChange={(event) => setTranslationName(event.target.value)}
              placeholder="translated name"
            />
            <Button type="submit">Add Translation</Button>
          </form>

          <div className="mt-3 rounded-md border">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Language</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {translationTarget.translations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-3 text-muted-foreground"
                    >
                      No translations yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  translationTarget.translations.map((translation) => (
                    <TableRow key={translation.languageCode}>
                      <TableCell>{translation.languageCode}</TableCell>
                      <TableCell>{translation.name}</TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="xs" variant="destructive">
                              Remove
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent size="sm">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Remove translation?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This translation entry will be deleted from this
                                template.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() =>
                                  handleDeleteTranslation(
                                    translation.languageCode,
                                  )
                                }
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
