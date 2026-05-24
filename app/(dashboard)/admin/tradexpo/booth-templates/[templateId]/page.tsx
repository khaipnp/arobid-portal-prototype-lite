import { EyeIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { BoothTemplateActiveToggleButton } from "@/components/tradexpo/booth-template-active-toggle-button";
import { BoothTemplateDeleteButton } from "@/components/tradexpo/booth-template-delete-button";
import { BoothTemplateDetailManager } from "@/components/tradexpo/booth-template-detail-manager";
import { DashboardShell } from "@/components/tradexpo/dashboard-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  listBoothTemplates,
  listBoothTemplateUsage,
  listBoothTypes,
} from "@/lib/tradexpo/db/booth-templates";
import { listHallTemplateAssets } from "@/lib/tradexpo/db/hall-templates";
import { formatDateTime } from "@/lib/tradexpo/utils";

export const dynamic = "force-dynamic";

export default async function BoothTemplateDetailPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;

  const [assets, templates, _usages, boothTypes] = await Promise.all([
    listHallTemplateAssets(),
    listBoothTemplates(),
    listBoothTemplateUsage(),
    listBoothTypes(),
  ]);

  const template = templates.find((item) => item.id === templateId);

  if (!template) {
    notFound();
  }

  const boothTypeName =
    boothTypes.find((type) => type.id === template.boothTypeId)?.name ??
    "Unknown";

  const status = template.isActive ? "Active" : "Inactive";

  return (
    <DashboardShell
      title={`${template.name}`}
      breadcrumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "TradeXpo", href: "/admin/tradexpo" },
        { label: "Booth Templates", href: "/admin/tradexpo/booth-templates" },
        { label: template.name },
      ]}
      showBackButton
    >
      <div className="grid grid-cols-3 gap-4 px-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Template Details
              <BoothTemplateActiveToggleButton
                templateId={template.id}
                isActive={template.isActive}
              />
            </CardTitle>

            <CardDescription>
              {template.description || "No description provided."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-3">
            <p>
              <span className="font-medium">Name:</span> {template.name}
            </p>
            <p>
              <span className="font-medium">Status:</span> {status}
            </p>
            <p>
              <span className="font-medium">Booth Type:</span> {boothTypeName}
            </p>
            <p>
              <span className="font-medium">Visibility:</span>
              {template.isPublic ? "Published" : "Draft"}
            </p>
            <p>
              <span className="font-medium">Updated by:</span>
              {template.updatedBy}
            </p>
            <p>
              <span className="font-medium">Updated at:</span>
              {formatDateTime(template.updatedAt)}
            </p>
          </CardContent>

          <CardFooter className="justify-end gap-2">
            <BoothTemplateDeleteButton
              templateId={template.id}
              templateName={template.name}
            />
            <Button variant="default" className="rounded-full">
              Preview
              <EyeIcon />
            </Button>
          </CardFooter>
        </Card>
        <BoothTemplateDetailManager
          initialTemplate={template}
          initialAssets={assets}
        />
      </div>
    </DashboardShell>
  );
}
