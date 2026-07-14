import { createComponent, createContext, useContext, type Accessor, type ParentProps } from "solid-js"

const MotionContext = createContext<Accessor<boolean>>(() => false)

export function MotionProvider(props: ParentProps<{ disabled: Accessor<boolean> }>) {
  return createComponent(MotionContext.Provider, {
    value: props.disabled,
    get children() {
      return props.children
    },
  })
}

export function useMotionDisabled() {
  return useContext(MotionContext)
}
