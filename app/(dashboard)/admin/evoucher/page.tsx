import { EVoucherManagement } from "@/components/evoucher/evoucher-management";
import { DashboardShell } from "@/components/tradexpo/dashboard-shell";
import {
  listVoucherBatches,
  listVoucherCodes,
  listVoucherTargets,
} from "@/lib/evoucher/db";

export const dynamic = "force-dynamic";

export default async function EVoucherPage() {
  const [batches, codes, targets] = await Promise.all([
    listVoucherBatches(),
    listVoucherCodes(),
    listVoucherTargets(),
  ]);

  return (
    <DashboardShell
      title="eVoucher Management"
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "eVoucher" }]}
    >
      <EVoucherManagement
        initialBatches={batches}
        initialCodes={codes}
        targets={targets}
      />
    </DashboardShell>
  );
}
