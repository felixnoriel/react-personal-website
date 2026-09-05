import { BYTE_LENGTH } from './uniforms'
import { GLSL_FRAG, GLSL_VERT } from './shaders'

export interface Backend {
  readonly kind: 'webgpu' | 'webgl2'
  readonly renderer: string
  resize(w: number, h: number): void
  draw(data: Float32Array): void
  destroy(): void
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh)
    gl.deleteShader(sh)
    throw new Error('deck: shader compile failed — ' + log)
  }
  return sh
}

export function createWebGL2(canvas: HTMLCanvasElement): Backend | null {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    desynchronized: true,
    powerPreference: 'high-performance',
  }) as WebGL2RenderingContext | null
  if (!gl) return null

  let prog: WebGLProgram
  try {
    const vs = compile(gl, gl.VERTEX_SHADER, GLSL_VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, GLSL_FRAG)
    prog = gl.createProgram()!
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error('deck: link failed — ' + gl.getProgramInfoLog(prog))
    }
  } catch {
    return null
  }

  const blockIndex = gl.getUniformBlockIndex(prog, 'U')
  if (blockIndex === gl.INVALID_INDEX) return null
  gl.uniformBlockBinding(prog, blockIndex, 0)

  const ubo = gl.createBuffer()!
  gl.bindBuffer(gl.UNIFORM_BUFFER, ubo)
  gl.bufferData(gl.UNIFORM_BUFFER, BYTE_LENGTH, gl.DYNAMIC_DRAW)
  gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, ubo)

  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)
  gl.useProgram(prog)
  gl.disable(gl.DEPTH_TEST)
  gl.disable(gl.BLEND)

  let renderer = 'webgl2'
  try {
    const dbg = gl.getExtension('WEBGL_debug_renderer_info')
    const raw = dbg
      ? (gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) as string)
      : (gl.getParameter(gl.RENDERER) as string)
    if (raw) renderer = raw
  } catch {
    /* masked — the generic name is fine */
  }

  let lost = false
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault()
    lost = true
  })

  return {
    kind: 'webgl2',
    renderer,
    resize(w, h) {
      canvas.width = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
    },
    draw(data) {
      if (lost) return
      gl.bindBuffer(gl.UNIFORM_BUFFER, ubo)
      gl.bufferSubData(gl.UNIFORM_BUFFER, 0, data)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    destroy() {
      gl.deleteBuffer(ubo)
      gl.deleteProgram(prog)
      gl.deleteVertexArray(vao)
    },
  }
}
