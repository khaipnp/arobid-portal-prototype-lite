import { describe, expect, test } from "bun:test"

import {
  confirmOwnerChange,
  type ExpoOwnerSelection,
  getOwnerDisplay
} from "$lib/tradexpo/expo-owner-flow"

describe("getOwnerDisplay", () => {
  test("falls back to expo owner email when selected owner record is missing", () => {
    expect(getOwnerDisplay(null, "owner@example.com")).toEqual({
      label: "owner@example.com",
      email: "owner@example.com"
    })
  })
})

describe("confirmOwnerChange", () => {
  test("clears owner input and selected owner after admin confirms owner change", () => {
    const currentOwner: ExpoOwnerSelection = {
      id: "user-old",
      email: "old@example.com",
      name: "Old Owner"
    }

    const next = confirmOwnerChange(currentOwner)

    expect(next).toEqual({
      ownerQuery: "",
      ownerPick: null,
      isChangingOwner: true
    })
  })
})
