// framer-motion feature bundle, loaded lazily by <LazyMotion> in App.
//
// Importing only `m` (the stripped motion component) + `LazyMotion` keeps the
// heavy animation feature set out of the initial bundle. This module is pulled
// in via a dynamic import() so Vite emits `domMax` as its own async chunk that
// loads in parallel with first paint (behind the boot veil).
//
// `domMax` (not `domAnimation`) because the app uses layout animations
// (the Header nav pill `layoutId`), which `domAnimation` does not include.
import { domMax } from 'framer-motion'

export default domMax
