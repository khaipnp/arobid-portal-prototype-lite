import Image from "next/image";
import { notFound } from "next/navigation";
import { ExpoPaymentConfigManager } from "@/components/orders/expo-payment-config";
import { DashboardShell } from "@/components/tradexpo/dashboard-shell";
import { ExpoDetailActions } from "@/components/tradexpo/expo-detail-actions";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getPlatformPaymentConfig,
  listExpoPaymentConfigs,
} from "@/lib/orders/db";
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema";
import { listHallTemplates } from "@/lib/tradexpo/db/hall-templates";
import {
  getExpoById,
  listExpoCategories,
  listExpoHalls,
  listExpoLayoutTemplates,
} from "@/lib/tradexpo/db/platform-data";
import type { ExpoStatus } from "@/lib/tradexpo/types";
import { formatDateTime, getExpoTimelinePhase } from "@/lib/tradexpo/utils";
import {
  resetExpoPaymentConfigToDefault,
  saveExpoPaymentConfig,
} from "./payment-actions";

const statusStyles: Record<ExpoStatus, string> = {
  Draft: "border-zinc-300 bg-zinc-100 text-zinc-600",
  "Pending Review": "border-amber-300 bg-amber-100 text-amber-700",
  Live: "border-emerald-300 bg-emerald-100 text-emerald-700",
  Archived: "border-zinc-300 bg-zinc-100 text-zinc-500",
  Canceled: "border-rose-300 bg-rose-100 text-rose-700",
};

const timelineStyles: Record<
  ReturnType<typeof getExpoTimelinePhase>,
  string
> = {
  Upcoming: "border-sky-300 bg-sky-100 text-sky-800",
  Live: "border-emerald-300 bg-emerald-100 text-emerald-800",
  Archived: "border-zinc-300 bg-zinc-100 text-zinc-600",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export const dynamic = "force-dynamic";

export default async function ExpoDetailPage({
  params,
}: {
  params: Promise<{ expoId: string }>;
}) {
  await ensurePlatformSchema();
  const { expoId } = await params;
  const expo = await getExpoById(expoId);
  if (!expo) notFound();

  const [
    halls,
    categories,
    layoutTemplates,
    hallTemplates,
    initialConfigs,
    platformPayment,
  ] = await Promise.all([
    listExpoHalls(expoId),
    listExpoCategories(),
    listExpoLayoutTemplates(),
    listHallTemplates(),
    listExpoPaymentConfigs(),
    getPlatformPaymentConfig(),
  ]);

  const layoutTemplateName =
    (expo.expoTemplateId &&
      layoutTemplates.find((t) => t.id === expo.expoTemplateId)?.name) ??
    expo.expoTemplateId ??
    "—";

  const categoryLabel =
    expo.categoryIds.length === 0
      ? "—"
      : expo.categoryIds
          .map((id) => categories.find((c) => c.id === id)?.name)
          .filter(Boolean)
          .join(", ");

  const hallTemplateName = (id: string) =>
    hallTemplates.find((h) => h.id === id)?.name ?? id;

  const timelinePhase =
    expo.startAt && expo.endAt
      ? getExpoTimelinePhase(Date.now(), expo.startAt, expo.endAt)
      : null;

  return (
    <DashboardShell
      title={expo.name}
      description={`${expo.ownerEmail} · ${formatDate(expo.startDate)} – ${formatDate(expo.endDate)}`}
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "TradeXpo", href: "/admin/tradexpo" },
        { label: "Expo List", href: "/admin/tradexpo/expos" },
        { label: expo.name },
      ]}
      showBackButton
    >
      <div className="space-y-6 px-4 lg:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={statusStyles[expo.status]}>
              {expo.status}
            </Badge>
            {timelinePhase ? (
              <Badge
                variant="outline"
                className={timelineStyles[timelinePhase]}
              >
                Timeline: {timelinePhase}
              </Badge>
            ) : null}
          </div>
          <ExpoDetailActions
            expoId={expoId}
            name={expo.name}
            ownerEmail={expo.ownerEmail}
            status={expo.status}
          />
        </div>

        <div className="max-w-xl overflow-hidden rounded-lg border">
          <Image
            src={expo.thumbnailUrl}
            alt={expo.name}
            width={640}
            height={360}
            className="aspect-video w-full object-cover"
          />
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="max-w-2xl rounded-lg border p-5">
              <h2 className="mb-4 font-semibold text-muted-foreground text-sm uppercase tracking-wide">
                Expo Information
              </h2>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-muted-foreground">Expo ID</span>
                <span className="font-mono text-xs">{expo.id}</span>

                {expo.description ? (
                  <div className="col-span-2 grid gap-1 sm:grid-cols-[auto_1fr]">
                    <span className="text-muted-foreground">Description</span>
                    <span className="whitespace-pre-wrap">
                      {expo.description}
                    </span>
                  </div>
                ) : null}

                <span className="text-muted-foreground">Categories</span>
                <span>{categoryLabel}</span>

                <span className="text-muted-foreground">
                  Expo layout template
                </span>
                <span>{layoutTemplateName}</span>

                <span className="text-muted-foreground">Owner</span>
                <span>{expo.ownerEmail}</span>

                <span className="text-muted-foreground">Start</span>
                <span>
                  {expo.startAt
                    ? formatDateTime(expo.startAt)
                    : formatDate(expo.startDate)}
                </span>

                <span className="text-muted-foreground">End</span>
                <span>
                  {expo.endAt
                    ? formatDateTime(expo.endAt)
                    : formatDate(expo.endDate)}
                </span>

                {expo.timezone ? (
                  <>
                    <span className="text-muted-foreground">Timezone</span>
                    <span>{expo.timezone}</span>
                  </>
                ) : null}

                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant="outline"
                  className={`w-fit text-xs ${statusStyles[expo.status]}`}
                >
                  {expo.status}
                </Badge>
              </div>
            </div>

            {halls.length > 0 ? (
              <div className="mt-8 max-w-3xl rounded-lg border p-5">
                <h2 className="mb-4 font-semibold text-muted-foreground text-sm uppercase tracking-wide">
                  Halls
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pr-4 pb-2 font-medium">Name</th>
                        <th className="pr-4 pb-2 font-medium">Template</th>
                        <th className="pr-2 pb-2 font-medium">Basic</th>
                        <th className="pr-2 pb-2 font-medium">Pro</th>
                        <th className="pb-2 font-medium">Premium</th>
                      </tr>
                    </thead>
                    <tbody>
                      {halls.map((h) => (
                        <tr key={h.id} className="border-border/60 border-b">
                          <td className="py-2 pr-4">{h.hallName}</td>
                          <td className="py-2 pr-4">
                            {hallTemplateName(h.hallTemplateId)}
                          </td>
                          <td className="py-2 pr-2">{h.basicQty}</td>
                          <td className="py-2 pr-2">{h.professionalQty}</td>
                          <td className="py-2">{h.premiumQty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="payment" className="mt-6 max-w-2xl">
            <ExpoPaymentConfigManager
              expoId={expo.id}
              expo={expo}
              initialConfigs={initialConfigs}
              platformPayment={platformPayment}
              onSaveConfig={saveExpoPaymentConfig}
              onResetConfig={resetExpoPaymentConfigToDefault}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
