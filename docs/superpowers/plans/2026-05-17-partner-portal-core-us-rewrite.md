# Partner Portal Core US Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement first 8 Partner Portal core user stories with Admin Portal control-plane support, using Arobid users + Partner Organization memberships as source of truth.

**Architecture:** Add canonical Partner Organization governance domain in `lib/partner`, enforce access by membership + capability + scope, then wire Admin Portal pages/APIs and Partner Portal MVP modules to those guards. Keep deferred Partner modules hidden and server-blocked instead of deleting broad legacy code in first pass.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Bun, Neon SQL helper, shadcn/ui, Biome.

---

## Execution Tasks

Task source: full plan exists in main checkout at `docs/superpowers/plans/2026-05-17-partner-portal-core-us-rewrite.md`; controller provides each task text directly to subagents.
