import { expect, test, type Page } from "@playwright/test"
import { mockOpenCodeServer } from "../utils/mock-server"

const directory = "C:/OpenCode/EfficientMode"

async function setup(page: Page, efficientMode: "always" | "unfocused") {
  await mockOpenCodeServer(page, {
    directory,
    project: {
      id: "proj_efficient_mode",
      worktree: directory,
      vcs: "git",
      name: "efficient-mode",
      time: { created: 1700000000000, updated: 1700000000000 },
      sandboxes: [],
    },
    provider: { all: [], connected: [], default: {} },
    sessions: [],
    pageMessages: () => ({ items: [] }),
  })
  await page.addInitScript((mode) => {
    localStorage.setItem(
      "settings.v3",
      JSON.stringify({ general: { efficientMode: mode, newLayoutDesigns: false } }),
    )
  }, efficientMode)
  await page.goto("/")
}

test("disables CSS motion in always mode", async ({ page }) => {
  await setup(page, "always")

  await expect(page.locator("html")).toHaveAttribute("data-efficient-mode", "")
  const styles = await page.evaluate(() => {
    const element = document.createElement("div")
    element.style.animation = "efficient-mode-test 1s linear infinite"
    element.style.transition = "opacity 1s linear"
    element.style.scrollBehavior = "smooth"
    document.body.append(element)
    const computed = getComputedStyle(element)
    return {
      animation: computed.animationName,
      transition: computed.transitionDuration,
      scroll: computed.scrollBehavior,
    }
  })

  expect(styles).toEqual({ animation: "none", transition: "0s", scroll: "auto" })
})

test("activates only while an unfocused window is inactive", async ({ page }) => {
  await setup(page, "unfocused")

  await expect(page.locator("html")).not.toHaveAttribute("data-efficient-mode")
  await page.evaluate(() => window.dispatchEvent(new Event("blur")))
  await expect(page.locator("html")).toHaveAttribute("data-efficient-mode", "")
  await page.evaluate(() => window.dispatchEvent(new Event("focus")))
  await expect(page.locator("html")).not.toHaveAttribute("data-efficient-mode")
})
