import { useEffect } from 'react'

/** Adds class "in" to .reveal elements when scrolled into view. Re-run with deps when content changes. */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    const ro = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target) } })
    }, { threshold: 0.12 })
    document.querySelectorAll('.reveal:not(.in)').forEach(el => ro.observe(el))
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
