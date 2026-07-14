import { MotionProvider } from "@opencode-ai/ui/context/motion"
import { createEffect, createMemo, onCleanup, onMount, type ParentProps } from "solid-js"
import { createStore } from "solid-js/store"
import { useSettings, type EfficientMode } from "./settings"

export function efficientModeActive(mode: EfficientMode, focused: boolean, visible: boolean) {
  if (mode === "always") return true
  return mode === "unfocused" && (!focused || !visible)
}

export function EfficientModeProvider(props: ParentProps) {
  const settings = useSettings()
  const [windowState, setWindowState] = createStore({
    focused: typeof document === "undefined" || document.hasFocus(),
    visible: typeof document === "undefined" || document.visibilityState === "visible",
  })
  const disabled = createMemo(() =>
    efficientModeActive(settings.general.efficientMode(), windowState.focused, windowState.visible),
  )

  onMount(() => {
    const update = () =>
      setWindowState({
        focused: document.hasFocus(),
        visible: document.visibilityState === "visible",
      })
    const blur = () => setWindowState("focused", false)

    window.addEventListener("focus", update)
    window.addEventListener("blur", blur)
    document.addEventListener("visibilitychange", update)
    update()

    onCleanup(() => {
      window.removeEventListener("focus", update)
      window.removeEventListener("blur", blur)
      document.removeEventListener("visibilitychange", update)
    })
  })

  createEffect(() => {
    if (typeof document === "undefined") return
    const active = disabled()
    document.documentElement.toggleAttribute("data-efficient-mode", active)

    if (!active) {
      document.querySelectorAll<HTMLVideoElement>("video[autoplay]").forEach((video) => void video.play().catch(() => {}))
      onCleanup(() => document.documentElement.removeAttribute("data-efficient-mode"))
      return
    }

    pauseVideos(document)
    const observer = new MutationObserver((records) => {
      records.flatMap((record) => [...record.addedNodes]).forEach((node) => {
        if (node instanceof Element) pauseVideos(node)
      })
    })
    observer.observe(document.body, { childList: true, subtree: true })
    onCleanup(() => {
      observer.disconnect()
      document.documentElement.removeAttribute("data-efficient-mode")
    })
  })

  return <MotionProvider disabled={disabled}>{props.children}</MotionProvider>
}

function pauseVideos(root: Document | Element) {
  if (root instanceof HTMLVideoElement) root.pause()
  root.querySelectorAll("video").forEach((video) => video.pause())
}
