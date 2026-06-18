"use client"

import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  EyeIcon,
  HeartIcon,
  ImagePlusIcon,
  MessageCircleIcon,
  PackageIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
  StarIcon,
  Trash2Icon
} from "lucide-react"
import Image from "next/image"
import type { ReactNode } from "react"
import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type { CompanyProduct } from "@/lib/tradexpo/types"

interface ProductManagementProps {
  initialProducts: CompanyProduct[]
}

type BuilderStep = "general" | "product" | "pricing" | "supply" | "policies"

type PriceMode = "public" | "contact"

interface LazyProductDraft {
  productName: string
  sku: string
  brandName: string
  hsCode: string
  unspscCode: string
  category: string
  description: string
  imageReady: boolean
  length: string
  width: string
  height: string
  dimensionUnit: string
  weight: string
  weightUnit: string
  material: string
  color: string
  unitOfMeasure: string
  countryOfOrigin: string
  priceMode: PriceMode
  variantAttribute: string
  variantValues: string[]
  variantsGenerated: boolean
  moq: string
  currency: string
  tierMin: string
  tierMax: string
  unitPrice: string
  productionQty: string
  productionUnit: string
  availabilityStatus: string
  paymentMethod: string
  incoterm: string
  sampleAvailable: boolean
  packagingType: string
  shippingPort: string
  certificateTags: string
  warrantyPeriod: string
  sparePartsAvailable: boolean
  supportChannels: string[]
  returnPolicy: string
}

interface StepConfig {
  id: BuilderStep
  label: string
}

interface AISuggestRequirement {
  id: string
  label: string
  ready: boolean
  step: BuilderStep
  stepLabel: string
  value: string
}

interface AISuggestReadiness {
  completed: number
  missingLabels: string[]
  ready: boolean
  requirements: AISuggestRequirement[]
  total: number
}

const builderSteps: StepConfig[] = [
  { id: "general", label: "General Information" },
  { id: "product", label: "Product Information" },
  { id: "pricing", label: "Pricing & MOQ" },
  { id: "supply", label: "Supply & Transport" },
  { id: "policies", label: "Certificate & Policies" }
]

const mediaUploadSlots = Array.from(
  { length: 10 },
  (_, index) => `product-image-slot-${index + 1}`
)

const previewThumbSlots = Array.from(
  { length: 5 },
  (_, index) => `buyer-preview-thumb-${index + 1}`
)

const initialDraft: LazyProductDraft = {
  productName: "",
  sku: "",
  brandName: "",
  hsCode: "",
  unspscCode: "",
  category: "",
  description: "",
  imageReady: false,
  length: "",
  width: "",
  height: "",
  dimensionUnit: "cm",
  weight: "",
  weightUnit: "kg",
  material: "",
  color: "",
  unitOfMeasure: "",
  countryOfOrigin: "Vietnam",
  priceMode: "public",
  variantAttribute: "SIZE",
  variantValues: [],
  variantsGenerated: false,
  moq: "",
  currency: "",
  tierMin: "",
  tierMax: "500",
  unitPrice: "",
  productionQty: "",
  productionUnit: "Carton (CTN)",
  availabilityStatus: "Ready to Ship",
  paymentMethod: "",
  incoterm: "",
  sampleAvailable: false,
  packagingType: "",
  shippingPort: "",
  certificateTags: "",
  warrantyPeriod: "",
  sparePartsAvailable: false,
  supportChannels: [],
  returnPolicy: ""
}

function isDone(value: string) {
  return value.trim().length > 0
}

function toMoneyValue(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function hasPositiveNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0
}

function getWorkflowStatus(product: CompanyProduct) {
  const status = product.metadata?.workflowStatus
  return typeof status === "string" ? status : undefined
}

function getAISuggestReadiness(draft: LazyProductDraft): AISuggestReadiness {
  const requirements: AISuggestRequirement[] = [
    {
      id: "productName",
      label: "Product Name",
      ready: isDone(draft.productName),
      step: "general",
      stepLabel: "General Information",
      value: draft.productName || "Missing"
    },
    {
      id: "moq",
      label: "MOQ",
      ready: hasPositiveNumber(draft.moq),
      step: "pricing",
      stepLabel: "Pricing & MOQ",
      value: draft.moq || "Missing"
    },
    {
      id: "currency",
      label: "Currency",
      ready: isDone(draft.currency),
      step: "pricing",
      stepLabel: "Pricing & MOQ",
      value: draft.currency || "Missing"
    },
    {
      id: "unitOfMeasure",
      label: "Unit",
      ready: isDone(draft.unitOfMeasure),
      step: "pricing",
      stepLabel: "Pricing & MOQ",
      value: draft.unitOfMeasure || "Missing"
    },
    {
      id: "imageReady",
      label: "Product Image",
      ready: draft.imageReady,
      step: "general",
      stepLabel: "General Information",
      value: draft.imageReady ? "Marked ready" : "Missing"
    }
  ]
  const completed = requirements.filter((item) => item.ready).length
  const missingLabels = requirements
    .filter((item) => !item.ready)
    .map((item) => item.label)

  return {
    completed,
    missingLabels,
    ready: completed === requirements.length,
    requirements,
    total: requirements.length
  }
}

function getMissingItems(draft: LazyProductDraft) {
  const missing: string[] = []

  if (!isDone(draft.productName)) missing.push("Product name")
  if (!isDone(draft.brandName)) missing.push("Brand name")
  if (!isDone(draft.category)) missing.push("Category")
  if (draft.description.trim().length < 40) missing.push("Description")
  if (!draft.imageReady) missing.push("Primary image")
  if (!isDone(draft.unitOfMeasure)) missing.push("Unit of measure")
  if (!hasPositiveNumber(draft.moq)) missing.push("MOQ")
  if (!isDone(draft.currency)) missing.push("Currency")
  if (draft.priceMode === "public" && !toMoneyValue(draft.unitPrice)) {
    missing.push("Unit price")
  }
  if (!isDone(draft.paymentMethod)) missing.push("Payment method")
  if (!isDone(draft.incoterm)) missing.push("Default Incoterm")

  return missing
}

export function ProductManagement({ initialProducts }: ProductManagementProps) {
  const [products, setProducts] = useState<CompanyProduct[]>(initialProducts)
  const [searchQuery, setSearchQuery] = useState("")
  const [builderOpen, setBuilderOpen] = useState(false)
  const [activeStep, setActiveStep] = useState<BuilderStep>("general")
  const [draft, setDraft] = useState<LazyProductDraft>(initialDraft)

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const missingItems = getMissingItems(draft)
  const aiReadiness = getAISuggestReadiness(draft)
  const canSubmit = missingItems.length === 0

  const updateDraft = <K extends keyof LazyProductDraft>(
    key: K,
    value: LazyProductDraft[K]
  ) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    if (productId.startsWith("prototype-draft-")) {
      setProducts((current) => current.filter((p) => p.id !== productId))
      toast.success("Product deleted successfully")
      return
    }

    try {
      const res = await fetch(`/api/seller/products/${productId}`, {
        method: "DELETE"
      })

      if (res.ok) {
        setProducts(products.filter((p) => p.id !== productId))
        toast.success("Product deleted successfully")
      } else {
        toast.error("Failed to delete product")
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("An error occurred while deleting the product")
    }
  }

  const applyAISuggestions = () => {
    const readiness = getAISuggestReadiness(draft)
    const firstMissing = readiness.requirements.find((item) => !item.ready)

    if (!readiness.ready) {
      toast.error(
        `Complete Smart Start first: ${readiness.missingLabels.join(", ")}`
      )
      if (firstMissing) setActiveStep(firstMissing.step)
      return
    }

    const baseName = draft.productName.trim()
    const normalizedSku = baseName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24)
      .toUpperCase()

    setDraft((current) => ({
      ...current,
      productName: baseName,
      sku: current.sku || `${normalizedSku || "PRODUCT"}-001`,
      brandName: current.brandName || "OEM / No brand",
      hsCode: current.hsCode || "7306.61",
      unspscCode: current.unspscCode || "30102304",
      category:
        current.category ||
        "Industrial Supplies > Metals & Alloys > Steel Pipes",
      description:
        current.description ||
        `${baseName} chất lượng cao cho công trình xây dựng, gia công cơ khí và đơn hàng B2B số lượng lớn. Sản phẩm phù hợp cho buyer cần nguồn cung ổn định, MOQ rõ ràng và điều khoản thương mại linh hoạt.`,
      imageReady: current.imageReady,
      length: current.length || "350",
      width: current.width || "650",
      height: current.height || "250",
      material: current.material || "Galvanized steel",
      color: current.color || "Silver",
      unitOfMeasure: current.unitOfMeasure || "Carton (CTN)",
      countryOfOrigin: current.countryOfOrigin || "Vietnam",
      variantAttribute: current.variantAttribute || "SIZE",
      variantValues:
        current.variantValues.length > 0
          ? current.variantValues
          : ["350x650", "550x250"],
      variantsGenerated: true,
      tierMin: current.tierMin || current.moq,
      unitPrice:
        current.priceMode === "public"
          ? current.unitPrice || "1"
          : current.unitPrice,
      paymentMethod: current.paymentMethod || "Bank Transfer",
      incoterm: current.incoterm || "FOB",
      packagingType: current.packagingType || "Carton packaging",
      shippingPort: current.shippingPort || "Cat Lai Port",
      certificateTags: current.certificateTags || "ISO 9001",
      warrantyPeriod: current.warrantyPeriod || "12 months",
      returnPolicy:
        current.returnPolicy ||
        "Wholesale return policy applies for confirmed quality issues within the agreed inspection window. Buyer and Seller will confirm replacement, refund, or credit note based on order terms."
    }))

    toast.success("AI suggestions applied. Please confirm required fields.")
  }

  const handleGenerateVariants = () => {
    setDraft((current) => ({
      ...current,
      variantValues:
        current.variantValues.length > 0
          ? current.variantValues
          : current.productName
            ? ["Default"]
            : ["350x650", "550x250"],
      variantsGenerated: true
    }))
    toast.success("Variants generated from attributes.")
  }

  const handleSaveDraft = () => {
    if (!isDone(draft.productName)) {
      toast.error("Product name is required before saving a draft.")
      setActiveStep("general")
      return
    }

    const now = new Date().toISOString()
    const draftProduct: CompanyProduct = {
      id: `prototype-draft-${Date.now()}`,
      companyId: products[0]?.companyId || "prototype-company",
      name: draft.productName,
      description: draft.description,
      price:
        draft.priceMode === "public"
          ? toMoneyValue(draft.unitPrice)
          : undefined,
      currency: draft.currency,
      sku: draft.sku,
      galleryUrls: [],
      categoryId: draft.category || undefined,
      isActive: false,
      metadata: {
        workflowStatus: canSubmit ? "Ready for Approval" : "Incomplete Draft",
        priceMode: draft.priceMode,
        moq: draft.moq,
        unitOfMeasure: draft.unitOfMeasure,
        source: "ai-assisted-product-form"
      },
      createdAt: now,
      updatedAt: now
    }

    setProducts((current) => [draftProduct, ...current])
    setBuilderOpen(false)
    setActiveStep("general")
    setDraft(initialDraft)
    toast.success("Draft saved to the prototype catalog.")
  }

  const handleSubmitForApproval = () => {
    if (!canSubmit) {
      toast.error(`Missing: ${missingItems.slice(0, 3).join(", ")}`)
      return
    }

    toast.success("Product is ready for Admin approval.")
  }

  const formatCurrency = (amount?: number, currency = "VND") => {
    if (amount === undefined) return "—"
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            Product Management
          </h1>
          <p className="text-muted-foreground">
            Manage your company's master product catalog for exhibitions.
          </p>
        </div>
        {builderOpen ? (
          <Button variant="outline" onClick={() => setBuilderOpen(false)}>
            <ArrowLeftIcon className="mr-2 size-4" />
            Back to Catalog
          </Button>
        ) : (
          <Button
            className="bg-orange-600 text-white hover:bg-orange-700"
            onClick={() => setBuilderOpen(true)}
          >
            <PlusIcon className="mr-2 size-4" />
            Add Product
          </Button>
        )}
      </div>

      {builderOpen ? (
        <ProductCreationForm
          activeStep={activeStep}
          aiReadiness={aiReadiness}
          canSubmit={canSubmit}
          draft={draft}
          missingItems={missingItems}
          onApplyAISuggestions={applyAISuggestions}
          onGenerateVariants={handleGenerateVariants}
          onSaveDraft={handleSaveDraft}
          onStepChange={setActiveStep}
          onSubmitForApproval={handleSubmitForApproval}
          onUpdate={updateDraft}
        />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle>Master Catalog</CardTitle>
                <CardDescription>
                  You have {products.length} products in your catalog.
                </CardDescription>
              </div>
              <div className="relative w-64">
                <SearchIcon className="absolute top-2.5 left-2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.mainImageUrl ? (
                          <Image
                            src={product.mainImageUrl}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="size-10 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                            <PackageIcon className="size-5" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{product.name}</span>
                          {product.description && (
                            <span className="line-clamp-1 font-normal text-muted-foreground text-xs">
                              {product.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {product.sku || "—"}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(product.price, product.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.isActive
                              ? "default"
                              : getWorkflowStatus(product)
                                ? "outline"
                                : "secondary"
                          }
                        >
                          {getWorkflowStatus(product) ||
                            (product.isActive ? "Active" : "Inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              toast.info("Edit feature coming soon!")
                            }
                          >
                            <PencilIcon className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2Icon className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ProductCreationForm({
  activeStep,
  aiReadiness,
  canSubmit,
  draft,
  missingItems,
  onApplyAISuggestions,
  onGenerateVariants,
  onSaveDraft,
  onStepChange,
  onSubmitForApproval,
  onUpdate
}: {
  activeStep: BuilderStep
  aiReadiness: AISuggestReadiness
  canSubmit: boolean
  draft: LazyProductDraft
  missingItems: string[]
  onApplyAISuggestions: () => void
  onGenerateVariants: () => void
  onSaveDraft: () => void
  onStepChange: (step: BuilderStep) => void
  onSubmitForApproval: () => void
  onUpdate: <K extends keyof LazyProductDraft>(
    key: K,
    value: LazyProductDraft[K]
  ) => void
}) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-600 text-sm">
          <span className="size-2 rounded-full bg-emerald-500" />
          Will auto-save in: 26s
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
            <EyeIcon className="mr-2 size-4" />
            Preview
          </Button>
          <Button variant="outline" onClick={onSaveDraft}>
            Save as Draft
          </Button>
          <Button disabled={!canSubmit} onClick={onSubmitForApproval}>
            Submit for Approval
          </Button>
        </div>
      </div>

      {missingItems.length > 0 && (
        <div className="mb-4 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm">
          <span className="font-medium text-orange-900">Submit readiness:</span>{" "}
          <span className="text-orange-800">
            Missing before submit: {missingItems.slice(0, 5).join(", ")}
            {missingItems.length > 5 ? "..." : ""}
          </span>
        </div>
      )}

      <SmartStartReadinessPanel
        onApply={onApplyAISuggestions}
        onStepChange={onStepChange}
        readiness={aiReadiness}
      />

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <StepRail activeStep={activeStep} onStepChange={onStepChange} />
        <div className="space-y-4">
          {activeStep === "general" && (
            <GeneralInformationStep draft={draft} onUpdate={onUpdate} />
          )}
          {activeStep === "product" && (
            <ProductInformationStep draft={draft} onUpdate={onUpdate} />
          )}
          {activeStep === "pricing" && (
            <PricingStep
              draft={draft}
              onGenerateVariants={onGenerateVariants}
              onUpdate={onUpdate}
            />
          )}
          {activeStep === "supply" && (
            <SupplyStep draft={draft} onUpdate={onUpdate} />
          )}
          {activeStep === "policies" && (
            <PoliciesStep draft={draft} onUpdate={onUpdate} />
          )}
        </div>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-6xl">
          <DialogHeader className="border-b px-5 py-4 pr-14">
            <DialogTitle>Buyer-facing product preview</DialogTitle>
            <DialogDescription>
              This preview updates from the current draft fields before submit.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[calc(92vh-88px)] overflow-auto bg-[#eef2f6] p-4">
            <ProductBuyerPreview draft={draft} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SmartStartReadinessPanel({
  onApply,
  onStepChange,
  readiness
}: {
  onApply: () => void
  onStepChange: (step: BuilderStep) => void
  readiness: AISuggestReadiness
}) {
  const progressPercent = Math.round(
    (readiness.completed / readiness.total) * 100
  )

  return (
    <div
      className={`mb-4 rounded-xl border p-4 ${
        readiness.ready
          ? "border-emerald-200 bg-emerald-50"
          : "border-orange-200 bg-orange-50"
      }`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <div
            className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
              readiness.ready
                ? "bg-emerald-100 text-emerald-700"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            <SparklesIcon className="size-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-sm">Smart Start AI Suggest</p>
              <Badge
                className={
                  readiness.ready
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-orange-100 text-orange-700"
                }
              >
                {readiness.completed}/{readiness.total} ready
              </Badge>
            </div>
            <p className="mt-1 text-muted-foreground text-sm">
              AI can suggest the remaining product fields only after Seller
              provides Product Name, MOQ, Currency, Unit, and Product Image.
            </p>
          </div>
        </div>
        <Button
          className="bg-orange-600 text-white hover:bg-orange-700 disabled:bg-muted disabled:text-muted-foreground"
          disabled={!readiness.ready}
          onClick={onApply}
        >
          {readiness.ready ? "Run AI Suggest" : "Complete 5 inputs first"}
        </Button>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
        <div
          className={`h-full rounded-full ${
            readiness.ready ? "bg-emerald-500" : "bg-orange-500"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-5">
        {readiness.requirements.map((item) => (
          <button
            className={`rounded-lg border bg-white p-3 text-left transition hover:border-orange-300 ${
              item.ready ? "border-emerald-200" : "border-orange-200"
            }`}
            key={item.id}
            onClick={() => onStepChange(item.step)}
            type="button"
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex size-5 items-center justify-center rounded-full ${
                  item.ready
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {item.ready ? (
                  <CheckCircle2Icon className="size-3" />
                ) : (
                  <span className="text-[10px]">!</span>
                )}
              </span>
              <span className="font-medium text-sm">{item.label}</span>
            </div>
            <p className="mt-2 truncate text-muted-foreground text-xs">
              {item.value}
            </p>
            <p className="mt-1 text-[11px] text-orange-700">{item.stepLabel}</p>
          </button>
        ))}
      </div>

      {!readiness.ready && (
        <p className="mt-3 text-orange-800 text-sm">
          Missing input for AI detect: {readiness.missingLabels.join(", ")}.
        </p>
      )}
    </div>
  )
}

function ProductBuyerPreview({ draft }: { draft: LazyProductDraft }) {
  const productTitle = draft.productName || "Product name preview"
  const companyName = draft.brandName || "Your company"
  const unit = draft.unitOfMeasure || "Unit"
  const moq = draft.moq || "1"
  const minQty = draft.tierMin || draft.moq || "1"
  const maxQty = draft.tierMax || "100"
  const quantityRange = `${minQty} - ${maxQty} ${unit}`
  const variantLabel = draft.variantAttribute || "Variant"
  const variantValues = Array.from(
    new Set(draft.variantValues.length ? draft.variantValues : [variantLabel])
  )
  const priceLabel =
    draft.priceMode === "contact"
      ? "Contact supplier"
      : formatPreviewPrice(draft.unitPrice, draft.currency)
  const dimensionSummary = [draft.length, draft.width, draft.height]
    .filter(Boolean)
    .join(" x ")
  const weightSummary = [draft.weight, draft.weightUnit]
    .filter(Boolean)
    .join(" ")
  const priceRanges = [
    { range: quantityRange, price: priceLabel, featured: true },
    {
      range: `MOQ ${moq} ${unit}`,
      price: draft.priceMode === "contact" ? "Contact" : priceLabel
    }
  ]
  const overviewBullets = [
    draft.countryOfOrigin ? `Origin: ${draft.countryOfOrigin}` : "",
    draft.color ? `Color: ${draft.color}` : "",
    draft.material ? `Material: ${draft.material}` : "",
    dimensionSummary
      ? `Size / dimensions: ${dimensionSummary} ${draft.dimensionUnit}`
      : "",
    draft.variantValues.length
      ? `${variantLabel} options: ${draft.variantValues.join(", ")}`
      : "",
    draft.productionQty
      ? `Production capacity: ${draft.productionQty} ${
          draft.productionUnit || unit
        } per month`
      : ""
  ].filter(Boolean)
  const specRows = [
    {
      label: "Size / Dimensions",
      value: dimensionSummary
        ? `${dimensionSummary} ${draft.dimensionUnit}`
        : "Not specified"
    },
    { label: "Weight", value: weightSummary || "Not specified" },
    { label: "Material", value: draft.material || "Not specified" },
    { label: "Color", value: draft.color || "Not specified" },
    {
      label: "Unit of Measure",
      value: draft.unitOfMeasure || "Not specified"
    },
    {
      label: "Country of Origin",
      value: draft.countryOfOrigin || "Not specified"
    },
    {
      label: "Certificates",
      value: draft.certificateTags || "Not specified"
    },
    {
      label: "Availability",
      value: draft.availabilityStatus || "Not specified"
    }
  ]

  return (
    <div className="mx-auto w-full max-w-6xl rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4 w-fit rounded-md bg-[#e5e7eb] px-3 py-1 text-[#6b7280] text-xs">
        Some information has been translated automatically.{" "}
        <span className="underline">Show Original</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#e4e7ff] px-3 py-1 font-medium text-[#022582] text-xs">
                NEW
              </span>
              <span className="rounded-full bg-legend px-3 py-1 font-medium text-white text-xs">
                LIVE
              </span>
              <span className="rounded-full bg-[#fee2e2] px-3 py-1 font-medium text-orange-700 text-xs">
                BUYER VIEW
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              Company:{" "}
              <span className="font-medium text-[#022582] underline">
                {companyName}
              </span>
            </p>
            <div className="flex items-start gap-2 pr-8">
              <h2 className="min-w-0 flex-1 font-semibold text-lg leading-7 sm:text-xl">
                {productTitle}
              </h2>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-full text-rose-600 hover:text-rose-700"
                aria-label="Wishlist preview"
              >
                <HeartIcon />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-[#6b7280] text-xs">
              <div className="flex items-center gap-0.5 text-yellow-500">
                {["r1", "r2", "r3", "r4", "r5"].map((ratingKey) => (
                  <StarIcon key={ratingKey} className="size-3.5 fill-current" />
                ))}
              </div>
              <span>(Preview reviews)</span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[88px_1fr]">
            <div className="order-2 flex gap-2 overflow-x-auto md:order-1 md:flex-col">
              {previewThumbSlots.map((slot, index) => (
                <button
                  key={slot}
                  type="button"
                  className={`relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white transition md:size-20 ${
                    index === 0
                      ? "border-legend ring-1 ring-legend/25"
                      : "border-muted hover:border-[#d1d5db]"
                  }`}
                  aria-label={`Preview thumbnail ${index + 1}`}
                >
                  <PackageIcon className="size-5 text-muted-foreground" />
                </button>
              ))}
            </div>

            <div
              className={`relative order-1 aspect-3/2 min-h-72 overflow-hidden rounded-2xl border md:order-2 ${
                draft.imageReady
                  ? "border-muted bg-[#fff7ed]"
                  : "border-muted border-dashed bg-[#f9fafb]"
              }`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="max-w-72 text-center">
                  <PackageIcon className="mx-auto mb-3 size-14 text-muted-foreground" />
                  <p className="font-medium text-sm">
                    {draft.imageReady
                      ? "Primary product image"
                      : "Product image placeholder"}
                  </p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    {draft.imageReady
                      ? "Image is marked ready and will appear in buyer gallery."
                      : "Mark image ready to preview the buyer gallery state."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-6 border-muted border-b px-5">
              <button
                type="button"
                className="border-legend border-b-2 py-3 font-medium text-legend text-sm"
              >
                Product Overview
              </button>
              <button
                type="button"
                className="py-3 font-medium text-foreground text-sm"
              >
                Technical Specifications
              </button>
            </div>

            <div className="space-y-5 p-5">
              <section className="space-y-3">
                <h4 className="font-semibold text-foreground text-xl">
                  Product Overview
                </h4>
                <p className="whitespace-pre-line text-foreground text-sm leading-5">
                  {draft.description ||
                    "Product overview will appear here as buyers see it."}
                </p>
                <ul className="list-disc space-y-1 pl-4 text-foreground text-sm leading-5">
                  {(overviewBullets.length
                    ? overviewBullets
                    : [
                        "AI suggestions or manual inputs will populate buyer-facing highlights."
                      ]
                  ).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>

              <section className="space-y-3">
                <h4 className="font-semibold text-foreground text-xl">
                  Technical Specifications
                </h4>
                <div className="overflow-hidden rounded-xl border border-muted">
                  <div className="grid grid-cols-2">
                    {specRows.map((row, index) => {
                      const hasBorder = index < specRows.length - 1

                      return (
                        <div className="contents" key={row.label}>
                          <div
                            className={`bg-[#f9fafb] px-4 py-2 text-sm ${
                              hasBorder ? "border-muted border-b" : ""
                            }`}
                          >
                            {row.label}
                          </div>
                          <div
                            className={`px-4 py-2 text-sm ${
                              hasBorder ? "border-muted border-b" : ""
                            }`}
                          >
                            {row.value}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="font-semibold text-base text-foreground">
                  Returns Policy
                </h4>
                <div className="rounded-xl border border-muted">
                  <div className="bg-[#f9fafb] px-4 py-3 text-sm">
                    Wholesale Return Policy
                  </div>
                  <div className="whitespace-pre-line p-4 text-foreground text-sm leading-5">
                    {draft.returnPolicy ||
                      "Return policy will appear here after the seller fills Certificate & Policies."}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        <aside className="h-fit flex-1 space-y-4 rounded-2xl border border-muted p-4">
          <div className="space-y-3">
            <p className="font-medium text-foreground text-sm">Price (MOQ)</p>
            <div className="grid grid-cols-2 gap-3">
              {priceRanges.map((priceItem) => (
                <div className="space-y-1" key={priceItem.range}>
                  <p className="text-muted-foreground text-xs">
                    {priceItem.range}
                  </p>
                  <p
                    className={`font-semibold text-sm ${
                      priceItem.featured ? "text-legend" : "text-foreground"
                    }`}
                  >
                    {priceItem.price}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 border-muted border-t pt-4">
            <p className="font-medium text-foreground text-sm">Variants</p>
            <div className="flex flex-wrap gap-2">
              {variantValues.slice(0, 4).map((variant, index) => (
                <button
                  key={variant}
                  type="button"
                  className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                    index === 0
                      ? "border-legend bg-[#fff7ed] text-[#9a3412]"
                      : "border-muted text-foreground"
                  }`}
                >
                  {variant}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 border-muted border-t pt-4">
            <p className="font-medium text-foreground text-sm">Quantity</p>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-32 items-center justify-between rounded-full border border-muted px-2">
                <button
                  type="button"
                  className="rounded-full bg-[#f3f4f6] px-2 py-1 text-sm"
                >
                  -
                </button>
                <span className="text-sm">{moq}</span>
                <button
                  type="button"
                  className="rounded-full px-2 py-1 text-sm"
                >
                  +
                </button>
              </div>
              <span className="text-[#6b7280] text-xs">
                MOQ: {moq} {unit}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button type="button" variant="outline" className="rounded-full">
              <MessageCircleIcon className="size-4" />
              Chat Now
            </Button>
            <Button
              type="button"
              className="rounded-full bg-legend text-white hover:bg-legend-600"
            >
              Send RFQ
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}

function formatPreviewPrice(value: string, currency: string) {
  const parsed = toMoneyValue(value)
  if (!parsed) return "Price preview"

  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: parsed % 1 === 0 ? 0 : 2
  }).format(parsed)

  return `${currency || "Currency"} ${formatted}`
}

function StepRail({
  activeStep,
  onStepChange
}: {
  activeStep: BuilderStep
  onStepChange: (step: BuilderStep) => void
}) {
  return (
    <div className="space-y-2 pr-2">
      {builderSteps.map((step, index) => {
        const isActive = step.id === activeStep
        return (
          <button
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition ${
              isActive
                ? "bg-orange-50 font-semibold text-orange-600"
                : "text-muted-foreground hover:bg-muted"
            }`}
            key={step.id}
            onClick={() => onStepChange(step.id)}
            type="button"
          >
            <span
              className={`flex size-5 items-center justify-center rounded-full text-xs ${
                isActive
                  ? "bg-orange-100 text-orange-600"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {index + 1}
            </span>
            {step.label}
          </button>
        )
      })}
    </div>
  )
}

function AISuggestionBar({
  children,
  onApply,
  title = "AI suggestion"
}: {
  children: ReactNode
  onApply?: () => void
  title?: string
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
      <div className="flex gap-3">
        <SparklesIcon className="mt-0.5 size-4 shrink-0 text-orange-600" />
        <div>
          <p className="font-medium text-orange-950 text-sm">{title}</p>
          <div className="text-orange-900/75 text-sm">{children}</div>
        </div>
      </div>
      {onApply && (
        <Button
          className="bg-orange-600 text-white hover:bg-orange-700"
          size="sm"
          onClick={onApply}
        >
          Apply AI Suggest
        </Button>
      )}
    </div>
  )
}

function FormSection({
  children,
  title
}: {
  children: ReactNode
  title: string
}) {
  return (
    <section className="rounded-xl border bg-white p-4">
      <h3 className="mb-4 font-semibold">{title}</h3>
      {children}
    </section>
  )
}

function FieldLabel({
  children,
  required = false
}: {
  children: ReactNode
  required?: boolean
}) {
  return (
    <span className="font-medium text-sm">
      {children}
      {required && <span className="text-destructive"> *</span>}
    </span>
  )
}

function GeneralInformationStep({
  draft,
  onUpdate
}: {
  draft: LazyProductDraft
  onUpdate: <K extends keyof LazyProductDraft>(
    key: K,
    value: LazyProductDraft[K]
  ) => void
}) {
  return (
    <>
      <FormSection title="Product Identification">
        <AISuggestionBar title="Smart Start input">
          Product Name is required for AI detect. After Smart Start reaches 5/5,
          AI can suggest SKU, category, description, HS/UNSPSC, specs, and trade
          defaults.
        </AISuggestionBar>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <FieldLabel required>Full Product Name</FieldLabel>
            <Input
              placeholder="Full Product Name"
              value={draft.productName}
              onChange={(event) => onUpdate("productName", event.target.value)}
            />
          </label>
          <label className="space-y-2">
            <FieldLabel>Model Number / SKU</FieldLabel>
            <Input
              placeholder="Model Number / SKU"
              value={draft.sku}
              onChange={(event) => onUpdate("sku", event.target.value)}
            />
          </label>
          <label className="space-y-2">
            <FieldLabel required>Brand Name</FieldLabel>
            <Input
              placeholder="Brand Name"
              value={draft.brandName}
              onChange={(event) => onUpdate("brandName", event.target.value)}
            />
          </label>
          <label className="space-y-2">
            <div className="flex items-center justify-between">
              <FieldLabel>HS Code</FieldLabel>
              <button className="text-blue-700 text-xs underline" type="button">
                Browse HS Code
              </button>
            </div>
            <Input
              placeholder="Select an item"
              value={draft.hsCode}
              onChange={(event) => onUpdate("hsCode", event.target.value)}
            />
          </label>
          <label className="space-y-2">
            <div className="flex items-center justify-between">
              <FieldLabel>UNSPSC Code</FieldLabel>
              <button className="text-blue-700 text-xs underline" type="button">
                Browse UNSPSC Code
              </button>
            </div>
            <Input
              placeholder="Select an item"
              value={draft.unspscCode}
              onChange={(event) => onUpdate("unspscCode", event.target.value)}
            />
          </label>
        </div>
      </FormSection>

      <FormSection title="Categorization & Placement">
        <label className="space-y-2">
          <FieldLabel required>Category</FieldLabel>
          <Input
            placeholder="Browse or search all categories..."
            value={draft.category}
            onChange={(event) => onUpdate("category", event.target.value)}
          />
        </label>
        {draft.category && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">AI suggested</Badge>
            <Badge variant="secondary">{draft.category}</Badge>
          </div>
        )}
      </FormSection>

      <FormSection title="Product Description (*)">
        <div className="mb-2 flex gap-1 rounded-t-lg border border-b-0 px-3 py-2 text-muted-foreground text-xs">
          <span>A-</span>
          <span className="rounded border px-2">16</span>
          <span>A+</span>
          <span className="px-2 font-bold">B</span>
          <span className="italic">I</span>
          <span className="underline">U</span>
        </div>
        <Textarea
          className="min-h-32 rounded-t-none"
          placeholder="Write a description..."
          value={draft.description}
          onChange={(event) => onUpdate("description", event.target.value)}
        />
      </FormSection>

      <FormSection title="Media & Product Story (*)">
        <AISuggestionBar title="Smart Start input">
          Mark the primary image as ready so AI can use visual context together
          with Product Name, MOQ, Currency, and Unit.
        </AISuggestionBar>
        <p className="mb-3 font-semibold">Product Image</p>
        <div className="grid gap-3 md:grid-cols-5">
          {mediaUploadSlots.map((slotId, index) => (
            <button
              className={`flex aspect-square items-center justify-center rounded-xl border border-dashed ${
                index === 0 && draft.imageReady
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-orange-300"
              }`}
              key={slotId}
              onClick={() =>
                index === 0 && onUpdate("imageReady", !draft.imageReady)
              }
              type="button"
            >
              {index === 0 ? (
                <span className="text-center text-sm">
                  <ImagePlusIcon className="mx-auto mb-2 size-6" />
                  <span className="font-medium text-orange-600">
                    {draft.imageReady ? "Image selected" : "Upload Image"}
                  </span>
                  <span className="mt-2 block text-xs">
                    JPG, JPEG, PNG, WEBP. Max 5MB.
                  </span>
                </span>
              ) : (
                <PlusIcon className="size-6" />
              )}
            </button>
          ))}
        </div>
      </FormSection>
    </>
  )
}

function ProductInformationStep({
  draft,
  onUpdate
}: {
  draft: LazyProductDraft
  onUpdate: <K extends keyof LazyProductDraft>(
    key: K,
    value: LazyProductDraft[K]
  ) => void
}) {
  return (
    <FormSection title="Technical Specifications">
      <AISuggestionBar title="AI output after Smart Start">
        These fields are AI-suggested after Product Name, MOQ, Currency, Unit,
        and Product Image are ready. Seller can still edit every value before
        submit.
      </AISuggestionBar>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel>Size / Dimensions</FieldLabel>
          <div className="grid gap-2 md:grid-cols-4">
            <Input
              placeholder="Length"
              value={draft.length}
              onChange={(event) => onUpdate("length", event.target.value)}
            />
            <Input
              placeholder="Width"
              value={draft.width}
              onChange={(event) => onUpdate("width", event.target.value)}
            />
            <Input
              placeholder="Height"
              value={draft.height}
              onChange={(event) => onUpdate("height", event.target.value)}
            />
            <NativeSelect
              className="w-full"
              value={draft.dimensionUnit}
              onChange={(event) =>
                onUpdate("dimensionUnit", event.target.value)
              }
            >
              <option value="cm">cm</option>
              <option value="mm">mm</option>
              <option value="m">m</option>
            </NativeSelect>
          </div>
        </div>
        <div className="space-y-2">
          <FieldLabel>Weight</FieldLabel>
          <div className="grid gap-2 md:grid-cols-[1fr_160px]">
            <Input
              placeholder="Weight"
              value={draft.weight}
              onChange={(event) => onUpdate("weight", event.target.value)}
            />
            <NativeSelect
              className="w-full"
              value={draft.weightUnit}
              onChange={(event) => onUpdate("weightUnit", event.target.value)}
            >
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="ton">ton</option>
            </NativeSelect>
          </div>
        </div>
        <label className="space-y-2">
          <FieldLabel>Material</FieldLabel>
          <Input
            placeholder="e.g. Monocrystalline Silicon"
            value={draft.material}
            onChange={(event) => onUpdate("material", event.target.value)}
          />
        </label>
        <label className="space-y-2">
          <FieldLabel>Color</FieldLabel>
          <Input
            placeholder="e.g. Black Frame"
            value={draft.color}
            onChange={(event) => onUpdate("color", event.target.value)}
          />
        </label>
        <label className="space-y-2">
          <FieldLabel required>Unit of Measure</FieldLabel>
          <NativeSelect
            className="w-full"
            value={draft.unitOfMeasure}
            onChange={(event) => onUpdate("unitOfMeasure", event.target.value)}
          >
            <option value="">Select an option</option>
            <option value="Carton (CTN)">Carton (CTN)</option>
            <option value="Piece (PCS)">Piece (PCS)</option>
            <option value="Ton">Ton</option>
            <option value="Meter">Meter</option>
          </NativeSelect>
        </label>
        <label className="space-y-2">
          <FieldLabel>Country of Origin</FieldLabel>
          <Input
            placeholder="Select an option"
            value={draft.countryOfOrigin}
            onChange={(event) =>
              onUpdate("countryOfOrigin", event.target.value)
            }
          />
        </label>
      </div>
    </FormSection>
  )
}

function PricingStep({
  draft,
  onGenerateVariants,
  onUpdate
}: {
  draft: LazyProductDraft
  onGenerateVariants: () => void
  onUpdate: <K extends keyof LazyProductDraft>(
    key: K,
    value: LazyProductDraft[K]
  ) => void
}) {
  const selectedVariant = draft.variantValues[0] || "Default"
  const priceSummary =
    draft.priceMode === "contact"
      ? "Contact for pricing"
      : draft.unitPrice
        ? `${draft.currency || "Currency"} ${draft.unitPrice}`
        : "Missing unit price"

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        <PriceModeCard
          active={draft.priceMode === "public"}
          description="Show price to increase transparency and attract buyers."
          label="Public Price *"
          onClick={() => onUpdate("priceMode", "public")}
        />
        <PriceModeCard
          active={draft.priceMode === "contact"}
          description='The price will be displayed as "Contact"'
          label="Contact for Pricing *"
          onClick={() => onUpdate("priceMode", "contact")}
        />
      </div>

      <FormSection title="Attribute">
        <AISuggestionBar title="AI output after Smart Start">
          Variant attributes can be suggested after Smart Start is ready. If no
          real variant is needed, Arobid creates one Default Variant so Seller
          can still enter price and MOQ.
        </AISuggestionBar>

        <div className="flex flex-col gap-4 border-b pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Attribute</p>
            <p className="font-semibold">{draft.variantAttribute}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {draft.variantValues.map((value) => (
                <Badge key={value} className="bg-orange-100 text-orange-700">
                  {value}
                </Badge>
              ))}
            </div>
          </div>
          <Button
            className="bg-orange-600 text-white hover:bg-orange-700"
            onClick={onGenerateVariants}
          >
            <PlusIcon className="mr-2 size-4" />
            Generate Variants
          </Button>
        </div>
        <p className="mt-4 text-muted-foreground text-sm">
          {draft.variantValues.length || 1} variant will be generated
        </p>
      </FormSection>

      <FormSection title="Variant Matrix *">
        <AISuggestionBar title="Smart Start inputs">
          MOQ, Currency, and Unit are required inputs for AI detect. Complete
          them here, then use Smart Start to suggest the remaining product
          details.
        </AISuggestionBar>

        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <FieldLabel required>Minimum Order Quantity (MOQ)</FieldLabel>
            <div className="grid gap-2 md:grid-cols-[1fr_180px]">
              <Input
                type="number"
                min={1}
                value={draft.moq}
                onChange={(event) => onUpdate("moq", event.target.value)}
              />
              <NativeSelect
                className="w-full"
                value={draft.unitOfMeasure}
                onChange={(event) =>
                  onUpdate("unitOfMeasure", event.target.value)
                }
              >
                <option value="">Select one</option>
                <option value="Carton (CTN)">Carton (CTN)</option>
                <option value="Piece (PCS)">Piece (PCS)</option>
                <option value="Ton">Ton</option>
              </NativeSelect>
            </div>
          </label>
          <label className="space-y-2">
            <FieldLabel required>Currency</FieldLabel>
            <NativeSelect
              className="w-full"
              value={draft.currency}
              onChange={(event) => onUpdate("currency", event.target.value)}
            >
              <option value="">Select currency</option>
              <option value="USD">US Dollar (USD)</option>
              <option value="VND">Vietnam Dong (VND)</option>
              <option value="EUR">Euro (EUR)</option>
            </NativeSelect>
          </label>
        </div>

        <div className="mb-3 flex items-center justify-between text-sm">
          <span>
            {draft.variantsGenerated
              ? "1 variant selected"
              : "0 variants selected"}
          </span>
          <Button variant="outline" size="sm" onClick={onGenerateVariants}>
            Edit Variants
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border">
          <div className="grid grid-cols-[40px_120px_1fr_180px_220px_80px] bg-muted/40 px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
            <span />
            <span>Image</span>
            <span>{draft.variantAttribute || "Variant"}</span>
            <span>Quantity Range</span>
            <span>Price Summary</span>
            <span>Actions</span>
          </div>
          <div className="grid grid-cols-[40px_120px_1fr_180px_220px_80px] items-center border-t px-4 py-3 text-sm">
            <Checkbox />
            <div className="flex size-10 items-center justify-center rounded-md bg-muted">
              <PackageIcon className="size-5" />
            </div>
            <Input
              value={selectedVariant}
              onChange={(event) =>
                onUpdate("variantValues", [event.target.value])
              }
            />
            <span>
              {draft.tierMin || draft.moq} - {draft.tierMax || "∞"}
            </span>
            <span className="font-medium">{priceSummary}</span>
            <Trash2Icon className="size-4 text-muted-foreground" />
          </div>
          <div className="border-t bg-muted/20 p-4">
            <p className="mb-3 font-semibold text-sm">Quantity Range *</p>
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_140px]">
              <label className="space-y-1">
                <FieldLabel required>Min</FieldLabel>
                <Input
                  type="number"
                  value={draft.tierMin}
                  onChange={(event) => onUpdate("tierMin", event.target.value)}
                />
              </label>
              <label className="space-y-1">
                <FieldLabel required>Max</FieldLabel>
                <Input
                  value={draft.tierMax}
                  onChange={(event) => onUpdate("tierMax", event.target.value)}
                />
              </label>
              <label className="space-y-1">
                <FieldLabel required>
                  Unit Price ({draft.currency || "Currency"})
                </FieldLabel>
                <Input
                  disabled={draft.priceMode === "contact"}
                  type="number"
                  step="0.01"
                  value={draft.unitPrice}
                  onChange={(event) =>
                    onUpdate("unitPrice", event.target.value)
                  }
                />
              </label>
              <label className="flex items-end gap-2 pb-2">
                <Checkbox
                  checked={draft.priceMode === "contact"}
                  onCheckedChange={(checked) =>
                    onUpdate(
                      "priceMode",
                      checked === true ? "contact" : "public"
                    )
                  }
                />
                <span className="text-sm">Contact</span>
              </label>
            </div>
            <Button className="mt-4 w-full" variant="outline">
              <PlusIcon className="mr-2 size-4" />
              Add Price Tier
            </Button>
          </div>
        </div>
      </FormSection>
    </>
  )
}

function SupplyStep({
  draft,
  onUpdate
}: {
  draft: LazyProductDraft
  onUpdate: <K extends keyof LazyProductDraft>(
    key: K,
    value: LazyProductDraft[K]
  ) => void
}) {
  return (
    <>
      <FormSection title="Production Capacity">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <FieldLabel>Quantity</FieldLabel>
            <Input
              placeholder="Enter quantity"
              value={draft.productionQty}
              onChange={(event) =>
                onUpdate("productionQty", event.target.value)
              }
            />
          </label>
          <label className="space-y-2">
            <FieldLabel>Units</FieldLabel>
            <NativeSelect
              className="w-full"
              value={draft.productionUnit}
              onChange={(event) =>
                onUpdate("productionUnit", event.target.value)
              }
            >
              <option value="Carton (CTN)">Carton (CTN)</option>
              <option value="Piece (PCS)">Piece (PCS)</option>
              <option value="Ton">Ton</option>
            </NativeSelect>
          </label>
          <label className="space-y-2">
            <FieldLabel>Availability Status</FieldLabel>
            <NativeSelect
              className="w-full"
              value={draft.availabilityStatus}
              onChange={(event) =>
                onUpdate("availabilityStatus", event.target.value)
              }
            >
              <option value="Ready to Ship">Ready to Ship</option>
              <option value="Made to Order">Made to Order</option>
              <option value="Pre-order">Pre-order</option>
            </NativeSelect>
          </label>
        </div>
      </FormSection>

      <FormSection title="Payment & Incoterms">
        <AISuggestionBar title="AI output after Smart Start">
          Trade defaults such as Bank Transfer and FOB can be suggested after
          Smart Start is ready, but Seller must confirm before submit.
        </AISuggestionBar>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <FieldLabel required>Payment Method</FieldLabel>
            <NativeSelect
              className="w-full"
              value={draft.paymentMethod}
              onChange={(event) =>
                onUpdate("paymentMethod", event.target.value)
              }
            >
              <option value="">Select payment method</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Letter of Credit">Letter of Credit</option>
              <option value="Negotiable">Negotiable</option>
            </NativeSelect>
          </label>
          <label className="space-y-2">
            <FieldLabel required>Default Incoterm</FieldLabel>
            <NativeSelect
              className="w-full"
              value={draft.incoterm}
              onChange={(event) => onUpdate("incoterm", event.target.value)}
            >
              <option value="">Select incoterm</option>
              <option value="FOB">FOB</option>
              <option value="CIF">CIF</option>
              <option value="EXW">EXW</option>
              <option value="DAP">DAP</option>
            </NativeSelect>
          </label>
        </div>
      </FormSection>

      <FormSection title="Sample Policy">
        <label className="flex items-center justify-between">
          <span className="font-medium">Sample available</span>
          <Checkbox
            checked={draft.sampleAvailable}
            onCheckedChange={(checked) =>
              onUpdate("sampleAvailable", checked === true)
            }
          />
        </label>
      </FormSection>

      <FormSection title="Packaging & Logistics">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <FieldLabel>Packaging Type</FieldLabel>
            <Input
              placeholder="Select packaging details"
              value={draft.packagingType}
              onChange={(event) =>
                onUpdate("packagingType", event.target.value)
              }
            />
          </label>
          <label className="space-y-2">
            <FieldLabel>Shipping Port (Vietnam)</FieldLabel>
            <Input
              placeholder="Select shipping port"
              value={draft.shippingPort}
              onChange={(event) => onUpdate("shippingPort", event.target.value)}
            />
          </label>
        </div>
      </FormSection>
    </>
  )
}

function PoliciesStep({
  draft,
  onUpdate
}: {
  draft: LazyProductDraft
  onUpdate: <K extends keyof LazyProductDraft>(
    key: K,
    value: LazyProductDraft[K]
  ) => void
}) {
  return (
    <>
      <FormSection title="Product Certifications & Compliance">
        <AISuggestionBar title="AI output after Smart Start">
          Based on detected category and target market, AI can suggest ISO 9001
          or compliance tags. Actual certificate files must still be uploaded.
        </AISuggestionBar>
        <label className="space-y-2">
          <FieldLabel>Compliance Tags</FieldLabel>
          <Input
            placeholder="ISO 9001, FDA, HACCP"
            value={draft.certificateTags}
            onChange={(event) =>
              onUpdate("certificateTags", event.target.value)
            }
          />
        </label>
        <button
          className="mt-4 flex size-40 flex-col items-center justify-center rounded-xl border border-orange-300 border-dashed text-center text-sm"
          type="button"
        >
          <ImagePlusIcon className="mb-2 size-6" />
          <span className="font-medium text-orange-600">Upload file</span>
          <span className="mt-1 text-xs">PDF, JPEG, PNG, JPG, max 5MB.</span>
        </button>
      </FormSection>

      <FormSection title="Customization Services">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center justify-between rounded-xl border p-4">
            <span>
              <span className="block font-medium">OEM Available</span>
              <span className="text-muted-foreground text-sm">
                Original Equipment Manufacturer
              </span>
            </span>
            <Checkbox />
          </label>
          <label className="flex items-center justify-between rounded-xl border p-4">
            <span>
              <span className="block font-medium">ODM Available</span>
              <span className="text-muted-foreground text-sm">
                Original Design Manufacturer
              </span>
            </span>
            <Checkbox />
          </label>
        </div>
      </FormSection>

      <FormSection title="Product Support & Warranty">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <FieldLabel>Warranty Period (Months)</FieldLabel>
            <NativeSelect
              className="w-full"
              value={draft.warrantyPeriod}
              onChange={(event) =>
                onUpdate("warrantyPeriod", event.target.value)
              }
            >
              <option value="">Select warranty period</option>
              <option value="6 months">6 months</option>
              <option value="12 months">12 months</option>
              <option value="24 months">24 months</option>
              <option value="36 months">36 months</option>
            </NativeSelect>
          </label>
          <label className="flex items-end gap-2 pb-3">
            <Checkbox
              checked={draft.sparePartsAvailable}
              onCheckedChange={(checked) =>
                onUpdate("sparePartsAvailable", checked === true)
              }
            />
            <span className="text-sm">Provide spare part</span>
          </label>
        </div>

        <div className="mt-4 space-y-2">
          <FieldLabel>Returns Policy</FieldLabel>
          <Textarea
            className="min-h-28"
            placeholder="Describe wholesale return policy..."
            value={draft.returnPolicy}
            onChange={(event) => onUpdate("returnPolicy", event.target.value)}
          />
        </div>
      </FormSection>
    </>
  )
}

function PriceModeCard({
  active,
  description,
  label,
  onClick
}: {
  active: boolean
  description: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      className={`rounded-xl border p-4 text-left transition ${
        active
          ? "border-orange-300 bg-orange-50"
          : "hover:border-orange-200 hover:bg-orange-50/40"
      }`}
      onClick={onClick}
      type="button"
    >
      <div className="flex gap-3">
        <span
          className={`mt-0.5 flex size-4 items-center justify-center rounded border ${
            active
              ? "border-orange-600 bg-orange-600 text-white"
              : "border-input"
          }`}
        >
          {active && <CheckCircle2Icon className="size-3" />}
        </span>
        <span>
          <span className="block font-semibold">{label}</span>
          <span className="block text-muted-foreground text-sm">
            {description}
          </span>
        </span>
      </div>
    </button>
  )
}
