import * as React from "react"

const MOBILE_BREAKPOINT = 768

function getViewportWidth() {
  if (typeof window === "undefined") {
    return MOBILE_BREAKPOINT
  }

  return window.visualViewport?.width ?? window.screen.width ?? window.innerWidth
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  const useIsomorphicLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

  useIsomorphicLayoutEffect(() => {
    const onChange = () => {
      setIsMobile(getViewportWidth() < MOBILE_BREAKPOINT)
    }

    onChange()
    window.addEventListener("resize", onChange)
    window.visualViewport?.addEventListener("resize", onChange)

    return () => {
      window.removeEventListener("resize", onChange)
      window.visualViewport?.removeEventListener("resize", onChange)
    }
  }, [])

  return !!isMobile
}
