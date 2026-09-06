/** SIGNAL — builds every morph target in idle slices. See shapes/index.ts. */
import { SHAPES, SHAPE_COUNT } from './shapes/index'
import type { ShapeCtx } from './shapes/index'

export { SHAPE, SHAPE_COUNT } from './shapes/index'

export interface ShapeBuild {
  data: Float32Array
  /** spend up to budgetMs; returns true once every shape is finished */
  step(budgetMs: number): boolean
}

export function createShapeBuild(n: number, scale: number, ctx: ShapeCtx): ShapeBuild {
  const data = new Float32Array(n * 4 * SHAPE_COUNT)
  const tasks = SHAPES.map((gen, s) => gen(data.subarray(s * n * 4, (s + 1) * n * 4), n, scale, ctx))
  let t = 0
  return {
    data,
    step(budgetMs) {
      const end = performance.now() + budgetMs
      while (t < tasks.length) {
        const r = tasks[t].next()
        if (r.done) t++
        if (performance.now() >= end) return t >= tasks.length
      }
      return true
    },
  }
}
