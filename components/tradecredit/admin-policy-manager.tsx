"use client"

import { SaveIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import type { CreditRule, CreditValuation } from "@/lib/tradecredit/types"

const vnd = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0
})

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

export function TradeCreditPolicyManager({
  initialRules,
  activeValuation,
  valuationHistory
}: {
  initialRules: CreditRule[]
  activeValuation: CreditValuation
  valuationHistory: CreditValuation[]
}) {
  const router = useRouter()
  const [rules, setRules] = useState(initialRules)
  const [savingRuleId, setSavingRuleId] = useState<string | null>(null)
  const [valuationSaving, setValuationSaving] = useState(false)
  const [valuationForm, setValuationForm] = useState({
    creditValueVnd: String(activeValuation.creditValueVnd),
    effectiveAt: "",
    reasonNote: ""
  })
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const groupedRules = useMemo(
    () => ({
      earn: rules.filter((rule) => rule.ruleType === "earn"),
      burn: rules.filter((rule) => rule.ruleType === "burn")
    }),
    [rules]
  )

  function updateRuleDraft(ruleId: string, patch: Partial<CreditRule>) {
    setRules((current) =>
      current.map((rule) =>
        rule.ruleId === ruleId ? { ...rule, ...patch } : rule
      )
    )
  }

  async function saveRule(rule: CreditRule) {
    setSavingRuleId(rule.ruleId)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch(`/api/tradecredit/policy/rules/${rule.ruleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEnabled: rule.isEnabled,
          creditQuantity: rule.creditQuantity
        })
      })
      const payload = (await response.json()) as {
        rule?: CreditRule
        error?: string
      }
      if (!response.ok || !payload.rule) {
        throw new Error(payload.error ?? "Unable to save rule.")
      }
      updateRuleDraft(rule.ruleId, payload.rule)
      setMessage("TradeCredit rule saved.")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save rule.")
    } finally {
      setSavingRuleId(null)
    }
  }

  async function saveValuation() {
    setValuationSaving(true)
    setError(null)
    setMessage(null)
    try {
      const effectiveAt = valuationForm.effectiveAt
        ? new Date(valuationForm.effectiveAt).toISOString()
        : new Date().toISOString()
      const response = await fetch("/api/tradecredit/policy/valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creditValueVnd: Number(valuationForm.creditValueVnd),
          effectiveAt,
          reasonNote: valuationForm.reasonNote
        })
      })
      const payload = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save valuation.")
      }
      setMessage("TradeCredit valuation saved.")
      setValuationForm((current) => ({ ...current, reasonNote: "" }))
      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save valuation."
      )
    } finally {
      setValuationSaving(false)
    }
  }

  return (
    <div className="space-y-4 px-4">
      {message ? (
        <div className="rounded-md border bg-muted px-3 py-2 text-sm">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-sm">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
        <RuleTable
          title="Earn Rules"
          description="System-owned triggers. Admin may only change status and credit quantity."
          rules={groupedRules.earn}
          savingRuleId={savingRuleId}
          onChange={updateRuleDraft}
          onSave={saveRule}
        />
        <Card>
          <CardHeader>
            <CardTitle>Credit Valuation</CardTitle>
            <CardDescription>
              Active burn-time value: {vnd.format(activeValuation.creditValueVnd)} per credit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="creditValueVnd">VND value for 1 credit</Label>
              <Input
                id="creditValueVnd"
                type="number"
                min={1}
                value={valuationForm.creditValueVnd}
                onChange={(event) =>
                  setValuationForm((current) => ({
                    ...current,
                    creditValueVnd: event.target.value
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="effectiveAt">Effective time</Label>
              <Input
                id="effectiveAt"
                type="datetime-local"
                value={valuationForm.effectiveAt}
                onChange={(event) =>
                  setValuationForm((current) => ({
                    ...current,
                    effectiveAt: event.target.value
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reasonNote">Reason note</Label>
              <Input
                id="reasonNote"
                value={valuationForm.reasonNote}
                onChange={(event) =>
                  setValuationForm((current) => ({
                    ...current,
                    reasonNote: event.target.value
                  }))
                }
                placeholder="Policy calibration for V1 launch"
              />
            </div>
            <Button
              className="w-full"
              disabled={valuationSaving}
              onClick={saveValuation}
            >
              <SaveIcon />
              {valuationSaving ? "Saving..." : "Save Valuation"}
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
        <RuleTable
          title="Burn Rules"
          description="Checkout and unlock-service burn rules. Trigger logic remains system-defined."
          rules={groupedRules.burn}
          savingRuleId={savingRuleId}
          onChange={updateRuleDraft}
          onSave={saveRule}
        />
        <Card>
          <CardHeader>
            <CardTitle>Valuation History</CardTitle>
            <CardDescription>
              Changing valuation does not rewrite balances or old earn ledger entries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {valuationHistory.map((valuation) => (
                <div
                  key={valuation.valuationId}
                  className="rounded-md border px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">
                      {vnd.format(valuation.creditValueVnd)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatDateTime(valuation.effectiveAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground text-xs">
                    {valuation.reasonNote}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function RuleTable({
  title,
  description,
  rules,
  savingRuleId,
  onChange,
  onSave
}: {
  title: string
  description: string
  rules: CreditRule[]
  savingRuleId: string | null
  onChange: (ruleId: string, patch: Partial<CreditRule>) => void
  onSave: (rule: CreditRule) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rule</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-36">Credits</TableHead>
              <TableHead>Cap</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.ruleId}>
                <TableCell>
                  <div className="font-medium">{rule.name}</div>
                  <div className="font-mono text-muted-foreground text-xs">
                    {rule.sourceModule}.{rule.triggerEventType}
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={rule.isEnabled}
                    onCheckedChange={(checked) =>
                      onChange(rule.ruleId, { isEnabled: checked })
                    }
                    aria-label={`Toggle ${rule.name}`}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    value={rule.creditQuantity}
                    onChange={(event) =>
                      onChange(rule.ruleId, {
                        creditQuantity: Number(event.target.value)
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {rule.capType.replaceAll("_", " ")}
                    {rule.capValue ? ` · ${rule.capValue}` : ""}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={savingRuleId === rule.ruleId}
                    onClick={() => onSave(rule)}
                  >
                    {savingRuleId === rule.ruleId ? "Saving" : "Save"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
