import { expect, test } from "bun:test"
import { useSpring } from "@opencode-ai/ui/motion-spring"
import { MotionProvider } from "@opencode-ai/ui/context/motion"
import { createComponent, createRoot, createSignal, type Accessor } from "solid-js"

test("snaps spring progress when the session changes", async () => {
  const state = createRoot((dispose) => {
    const [target, setTarget] = createSignal(0)
    const [session, setSession] = createSignal("session-a")
    const progress = useSpring(target, { visualDuration: 0.3, bounce: 0 }, session)
    return { dispose, progress, setTarget, setSession }
  })

  await new Promise<void>(queueMicrotask)
  state.setTarget(1)
  expect(state.progress()).toBe(0)

  state.setSession("session-b")
  expect(state.progress()).toBe(1)
  state.dispose()
})

test("snaps spring progress while motion is disabled", async () => {
  const state = createRoot((dispose) => {
    const [target, setTarget] = createSignal(0)
    const [disabled, setDisabled] = createSignal(false)
    let progress: Accessor<number> | undefined
    const Spring = () => {
      progress = useSpring(target, { visualDuration: 0.3, bounce: 0 })
      return null
    }

    createComponent(MotionProvider, {
      disabled,
      get children() {
        return createComponent(Spring, {})
      },
    })

    return { dispose, progress: () => progress?.(), setTarget, setDisabled }
  })

  await new Promise<void>(queueMicrotask)
  state.setTarget(1)
  expect(state.progress()).toBe(0)

  state.setDisabled(true)
  expect(state.progress()).toBe(1)

  state.setTarget(0)
  expect(state.progress()).toBe(0)
  state.dispose()
})
