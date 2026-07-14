import { attachSpring, motionValue } from "motion"
import type { SpringOptions } from "motion"
import { createComputed, createEffect, createSignal, onCleanup } from "solid-js"
import { useMotionDisabled } from "../context/motion"

type Opt = Partial<Pick<SpringOptions, "visualDuration" | "bounce" | "stiffness" | "damping" | "mass" | "velocity">>
const eq = (a: Opt | undefined, b: Opt | undefined) =>
  a?.visualDuration === b?.visualDuration &&
  a?.bounce === b?.bounce &&
  a?.stiffness === b?.stiffness &&
  a?.damping === b?.damping &&
  a?.mass === b?.mass &&
  a?.velocity === b?.velocity

export function useSpring(target: () => number, options?: Opt | (() => Opt), snapKey?: () => unknown) {
  const disabled = useMotionDisabled()
  const read = () => (typeof options === "function" ? options() : options)
  const [value, setValue] = createSignal(target())
  const source = motionValue(value())
  const spring = motionValue(value())
  let config = read()
  let snapValue = snapKey?.()
  let motionDisabled = disabled()
  let stop = motionDisabled ? () => {} : attachSpring(spring, source, config)
  let off = spring.on("change", (next: number) => setValue(next))

  createComputed(() => {
    const next = target()
    const nextSnap = snapKey?.()
    const nextDisabled = disabled()
    if (nextDisabled !== motionDisabled) {
      motionDisabled = nextDisabled
      snapValue = nextSnap
      stop()
      spring.jump(next)
      source.jump(next)
      stop = motionDisabled ? () => {} : attachSpring(spring, source, config)
      setValue(next)
      return
    }
    if (snapKey && nextSnap !== snapValue) {
      // State boundaries should adopt their target without animating from the previous context.
      snapValue = nextSnap
      stop()
      spring.jump(next)
      source.jump(next)
      stop = motionDisabled ? () => {} : attachSpring(spring, source, config)
      setValue(next)
      return
    }
    if (motionDisabled) {
      spring.jump(next)
      source.jump(next)
      setValue(next)
      return
    }
    source.set(next)
  })

  createEffect(() => {
    if (!options) return
    const next = read()
    if (eq(config, next)) return
    config = next
    stop()
    stop = motionDisabled ? () => {} : attachSpring(spring, source, next)
    setValue(spring.get())
  })

  onCleanup(() => {
    off()
    stop()
    spring.destroy()
    source.destroy()
  })

  return value
}
