# Expo Form Step UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `ExpoForm` from two tabs into a responsive step-based wizard while preserving existing state, validation, payload, and API behavior.

**Architecture:** Keep one `ExpoForm` client component and one `<form>`. Add local step metadata/state, render a sidebar/horizontal step nav, and move existing UI blocks into step-specific render helpers inside the same file. Admin mode gets five steps; partner-content edit gets three steps.

**Tech Stack:** Next.js App Router, React 19 client component, TypeScript, shadcn/ui primitives, Tailwind CSS v4, Biome.

---

## File Structure

- Modify: `components/tradexpo/expo-form.tsx`
  - Remove `Tabs` import and tab rendering.
  - Add step metadata types/constants.
  - Add active step state and navigation helpers.
  - Render responsive step nav plus active step content.
  - Keep owner confirmation dialog, errors, and submit handler unchanged.
- No new test files, following project preference.
- Verification: `bun typecheck`, then `bun check` if formatting/import order fails.

---

### Task 1: Add step model and remove Tabs dependency

**Files:**
- Modify: `components/tradexpo/expo-form.tsx:44`
- Modify: `components/tradexpo/expo-form.tsx:113-133`
- Modify: `components/tradexpo/expo-form.tsx:222-228`

- [ ] **Step 1: Remove Tabs import**

Delete this import line from `components/tradexpo/expo-form.tsx`:

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
```

- [ ] **Step 2: Add step types after schedule options**

Insert after `SCHEDULE_PRECISION_OPTIONS`:

```tsx
type ExpoFormStepId = "general" | "schedule" | "owner" | "halls" | "marketing";

type ExpoFormStep = {
  id: ExpoFormStepId;
  title: string;
  description: string;
};

const ADMIN_EXPO_FORM_STEPS: ExpoFormStep[] = [
  {
    id: "general",
    title: "Thông tin chung",
    description: "Tên, mô tả, hình ảnh và danh mục",
  },
  {
    id: "schedule",
    title: "Lịch trình",
    description: "Độ chính xác và thời gian tổ chức",
  },
  {
    id: "owner",
    title: "Expo owner",
    description: "Người sở hữu và vận hành expo",
  },
  {
    id: "halls",
    title: "Hall configuration",
    description: "Hall, template và số lượng booth",
  },
  {
    id: "marketing",
    title: "Marketing content",
    description: "Nội dung hiển thị ngoài trang chi tiết",
  },
];

const PARTNER_EXPO_FORM_STEPS = ADMIN_EXPO_FORM_STEPS.filter(
  (step) => step.id !== "owner" && step.id !== "halls",
);
```

- [ ] **Step 3: Add active step state inside `ExpoForm`**

After `const isSuper = props.isSuper ?? false;`, insert:

```tsx
  const visibleSteps = isPartnerContentEdit
    ? PARTNER_EXPO_FORM_STEPS
    : ADMIN_EXPO_FORM_STEPS;
  const [activeStepId, setActiveStepId] =
    React.useState<ExpoFormStepId>("general");

  React.useEffect(() => {
    if (!visibleSteps.some((step) => step.id === activeStepId)) {
      setActiveStepId(visibleSteps[0]?.id ?? "general");
    }
  }, [activeStepId, visibleSteps]);
```

Expected issue: `visibleSteps` array identity changes each render for partner ternary? Constants are stable. OK.

- [ ] **Step 4: Run typecheck to catch import/type errors**

Run:

```bash
bun typecheck
```

Expected: may fail because JSX still references `Tabs`. Task 2 fixes render. If failure mentions only missing `Tabs`, continue.

---

### Task 2: Replace Tabs wrapper with step layout shell

**Files:**
- Modify: `components/tradexpo/expo-form.tsx:566-595`
- Modify: `components/tradexpo/expo-form.tsx:595-1420`
- Modify: `components/tradexpo/expo-form.tsx:1450-1462`

- [ ] **Step 1: Add navigation derived values before return**

After `filteredCategories` memo, insert:

```tsx
  const activeStepIndex = Math.max(
    visibleSteps.findIndex((step) => step.id === activeStepId),
    0,
  );
  const activeStep = visibleSteps[activeStepIndex] ?? visibleSteps[0];
  const isFirstStep = activeStepIndex === 0;
  const isLastStep = activeStepIndex === visibleSteps.length - 1;

  function goToPreviousStep() {
    const previousStep = visibleSteps[activeStepIndex - 1];
    if (previousStep) {
      setActiveStepId(previousStep.id);
    }
  }

  function goToNextStep() {
    const nextStep = visibleSteps[activeStepIndex + 1];
    if (nextStep) {
      setActiveStepId(nextStep.id);
    }
  }
```

- [ ] **Step 2: Replace return opening and Tabs shell**

Replace the start of return from:

```tsx
  return (
    <form className="mt-5 space-y-3" onSubmit={onSubmit}>
      <Tabs defaultValue="general" className="space-y-3">
        <TabsList>
          <TabsTrigger value="general">General Info</TabsTrigger>
          <TabsTrigger value="marketing">Marketing Content</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-3">
```

with:

```tsx
  return (
    <form className="mt-5 space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav
          aria-label="Expo form steps"
          className="flex gap-2 overflow-x-auto rounded-2xl border bg-card p-2 lg:flex-col lg:self-start"
        >
          {visibleSteps.map((step, index) => {
            const isActive = step.id === activeStep.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStepId(step.id)}
                className={cn(
                  "flex min-w-56 items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors lg:min-w-0",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full font-medium text-xs",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {index + 1}
                </span>
                <span className="grid gap-1">
                  <span className="font-medium text-sm leading-none">
                    {step.title}
                  </span>
                  <span className="line-clamp-2 text-xs leading-snug">
                    {step.description}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 space-y-3">
```

- [ ] **Step 3: Replace old Tabs closing**

Near the end of content, replace:

```tsx
        </TabsContent>
      </Tabs>
```

with:

```tsx
        </div>
      </div>
```

- [ ] **Step 4: Replace footer controls**

Replace current footer:

```tsx
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
```

with:

```tsx
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(cancelHref)}
        >
          Cancel
        </Button>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isFirstStep}
            onClick={goToPreviousStep}
          >
            Previous
          </Button>
          {isLastStep ? (
            <Button type="submit" disabled={!canSubmit || submitting}>
              {submitting ? <Spinner /> : null}
              {isEdit ? "Save changes" : "Create expo"}
            </Button>
          ) : (
            <Button type="button" onClick={goToNextStep}>
              Next
            </Button>
          )}
        </div>
      </div>
```

- [ ] **Step 5: Run formatter/check**

Run:

```bash
bun check
```

Expected: Biome formats file and organizes imports. If JSX is structurally broken due old content still unguarded, continue Task 3 to wrap content by step.

---

### Task 3: Gate existing content by active step

**Files:**
- Modify: `components/tradexpo/expo-form.tsx:603-1419`

- [ ] **Step 1: Wrap general information card**

Before the first `Card` that contains title `General information`, insert:

```tsx
          {activeStep.id === "general" ? (
```

After that card closes, before the owner card conditional, insert:

```tsx
          ) : null}
```

General card includes fields: name, slug, description, thumbnail, template, categories. Move existing Schedule section out in Step 2.

- [ ] **Step 2: Move Schedule section into its own card**

Cut the existing `<section className="space-y-3 rounded-lg border p-4">` with heading `Schedule` from inside general card. Paste after general card closing guard as:

```tsx
          {activeStep.id === "schedule" ? (
            <Card>
              <CardHeader>
                <CardTitle>Lịch trình</CardTitle>
                <CardDescription>
                  Choose how precise the Expo schedule is right now.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <section className="space-y-3 rounded-lg border p-4">
                  [existing schedule controls unchanged]
                </section>
              </CardContent>
            </Card>
          ) : null}
```

Actual pasted controls must remain exactly same logic:

```tsx
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
```

Keep exact date, month/year, unscheduled, and `scheduleError` blocks unchanged.

- [ ] **Step 3: Wrap owner card by owner step**

Change:

```tsx
          {!isPartnerContentEdit ? (
            <Card>
```

for owner card into:

```tsx
          {!isPartnerContentEdit && activeStep.id === "owner" ? (
            <Card>
```

- [ ] **Step 4: Wrap hall card by halls step**

Change:

```tsx
          {!isPartnerContentEdit ? (
            <Card>
```

for hall configuration card into:

```tsx
          {!isPartnerContentEdit && activeStep.id === "halls" ? (
            <Card>
```

- [ ] **Step 5: Replace marketing TabsContent wrapper with active step guard**

Replace:

```tsx
        <TabsContent value="marketing" className="space-y-3">
```

with:

```tsx
          {activeStep.id === "marketing" ? (
```

Replace its matching close:

```tsx
        </TabsContent>
```

with:

```tsx
          ) : null}
```

- [ ] **Step 6: Run typecheck**

Run:

```bash
bun typecheck
```

Expected: PASS. If failure points to mismatched JSX tags, inspect `components/tradexpo/expo-form.tsx` around changed guards and fix nesting.

---

### Task 4: Polish copy, accessibility, and disabled states

**Files:**
- Modify: `components/tradexpo/expo-form.tsx`

- [ ] **Step 1: Add current step heading above card content if needed**

If step card title duplicates nav only for schedule/marketing but not all cards, keep card titles as existing. Do not add extra hidden heading.

- [ ] **Step 2: Ensure step nav buttons have stable accessible names**

Confirm button content includes visible text title and description. `aria-current="step"` is set only on active button.

- [ ] **Step 3: Ensure footer buttons use `type="button"` except submit**

Footer must match:

```tsx
<Button type="button" variant="outline" onClick={() => router.push(cancelHref)}>
  Cancel
</Button>
<Button type="button" variant="outline" disabled={isFirstStep} onClick={goToPreviousStep}>
  Previous
</Button>
<Button type="button" onClick={goToNextStep}>
  Next
</Button>
<Button type="submit" disabled={!canSubmit || submitting}>
  {submitting ? <Spinner /> : null}
  {isEdit ? "Save changes" : "Create expo"}
</Button>
```

- [ ] **Step 4: Run formatter**

Run:

```bash
bun check
```

Expected: PASS or files formatted. If command writes changes, run it once more until no new changes or no errors.

---

### Task 5: Final verification

**Files:**
- Verify only.

- [ ] **Step 1: Run TypeScript check**

Run:

```bash
bun typecheck
```

Expected: PASS.

- [ ] **Step 2: Inspect git diff**

Run:

```bash
git diff -- components/tradexpo/expo-form.tsx docs/superpowers/specs/2026-06-01-expo-form-step-ui-design.md docs/superpowers/plans/2026-06-01-expo-form-step-ui.md
```

Expected:

- `expo-form.tsx` uses step nav and no `Tabs` imports/usages.
- Spec and plan files exist.
- No API/schema files changed.

- [ ] **Step 3: Do not commit unless user asks**

Project/session preference says code in current session and no branch/worktree unless requested. Harness says commit only when user asks. Leave changes uncommitted.

---

## Self-review

- Spec coverage: step nav, five admin steps, partner three steps, previous/next, final submit, unchanged payload/API all covered.
- Placeholder scan: no TBD/TODO/later placeholders.
- Type consistency: `ExpoFormStepId`, `ExpoFormStep`, `ADMIN_EXPO_FORM_STEPS`, `PARTNER_EXPO_FORM_STEPS`, `activeStepId`, `activeStep` names are consistent across tasks.
- Testing preference: no new test files; verification uses `bun typecheck` and `bun check`.
