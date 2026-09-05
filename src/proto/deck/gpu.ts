import { BYTE_LENGTH } from './uniforms'
import { WGSL } from './shaders'
import type { Backend } from './gl'

/* WebGPU has no ambient types in this repo, so the handles stay `any` on
   purpose — every call below is guarded and falls back to WebGL2. */
type Any = any

export async function createWebGPU(
  canvas: HTMLCanvasElement,
): Promise<(Backend & { hdr: boolean }) | null> {
  const nav = navigator as Any
  if (!nav.gpu) return null

  let adapter: Any
  let device: Any
  try {
    adapter = await nav.gpu.requestAdapter({ powerPreference: 'high-performance' })
    if (!adapter) return null
    device = await adapter.requestDevice()
    if (!device) return null
  } catch {
    return null
  }

  const ctx = canvas.getContext('webgpu') as Any
  if (!ctx) return null

  const preferred = nav.gpu.getPreferredCanvasFormat()
  let format = preferred
  let hdr = false

  // HDR highlights where the display has them. Chrome's extended tone-mapping
  // canvas config is new enough that we validate it by actually asking for a
  // texture; anything unhappy falls straight back to the 8-bit path.
  try {
    ctx.configure({
      device,
      format: 'rgba16float',
      alphaMode: 'opaque',
      toneMapping: { mode: 'extended' },
    })
    ctx.getCurrentTexture()
    format = 'rgba16float'
    hdr = true
  } catch {
    hdr = false
  }
  if (!hdr) {
    ctx.configure({ device, format: preferred, alphaMode: 'opaque' })
    format = preferred
  }

  let module: Any
  let pipeline: Any
  try {
    module = device.createShaderModule({ code: WGSL })
    pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: { module, entryPoint: 'vs' },
      fragment: { module, entryPoint: 'fs', targets: [{ format }] },
      primitive: { topology: 'triangle-list' },
    })
  } catch {
    return null
  }

  const ubo = device.createBuffer({
    size: BYTE_LENGTH,
    usage: 0x40 | 0x8, // UNIFORM | COPY_DST
  })
  const bind = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: ubo } }],
  })

  const info = adapter.info || {}
  const renderer =
    [info.vendor, info.architecture].filter(Boolean).join(' ') ||
    info.description ||
    'webgpu adapter'

  let dead = false
  device.lost?.then?.(() => {
    dead = true
  })

  return {
    kind: 'webgpu',
    renderer,
    hdr,
    resize(w: number, h: number) {
      canvas.width = w
      canvas.height = h
    },
    draw(data: Float32Array) {
      if (dead) return
      let view: Any
      try {
        view = ctx.getCurrentTexture().createView()
      } catch {
        return
      }
      device.queue.writeBuffer(ubo, 0, data.buffer, data.byteOffset, data.byteLength)
      const enc = device.createCommandEncoder()
      const pass = enc.beginRenderPass({
        colorAttachments: [
          {
            view,
            clearValue: { r: 0.04, g: 0.03, b: 0.07, a: 1 },
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
      })
      pass.setPipeline(pipeline)
      pass.setBindGroup(0, bind)
      pass.draw(3)
      pass.end()
      device.queue.submit([enc.finish()])
    },
    destroy() {
      try {
        ubo.destroy()
        device.destroy()
      } catch {
        /* nothing to do */
      }
    },
  }
}
