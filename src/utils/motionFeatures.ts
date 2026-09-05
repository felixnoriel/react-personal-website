// framer-motion feature bundle, loaded lazily by <LazyMotion> in App.
//
// Importing only `m` (the stripped motion component) + `LazyMotion` keeps the
// heavy animation feature set out of the initial bundle. This module is pulled
// in via a dynamic import() so Vite emits `domMax` as its own async chunk —
// and the build injects a `<link rel="modulepreload">` for it into index.html
// (see vite.config.ts), so the fetch starts with the HTML, in parallel with
// the entry, instead of a serial round-trip after the entry executes.
//
// `domMax` (not `domAnimation`) because the app uses layout animations
// (the Header nav pill `layoutId`), which `domAnimation` does not include.
import { domMax } from 'motion/react'

export default domMax
