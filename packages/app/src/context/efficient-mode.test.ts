import { describe, expect, test } from "bun:test"
import { efficientModeActive } from "./efficient-mode"

describe("efficient mode", () => {
  test("stays disabled when turned off", () => {
    expect(efficientModeActive("off", false, false)).toBe(false)
  })

  test("stays active in always mode", () => {
    expect(efficientModeActive("always", true, true)).toBe(true)
  })

  test("tracks window focus and visibility", () => {
    expect(efficientModeActive("unfocused", true, true)).toBe(false)
    expect(efficientModeActive("unfocused", false, true)).toBe(true)
    expect(efficientModeActive("unfocused", true, false)).toBe(true)
  })
})
