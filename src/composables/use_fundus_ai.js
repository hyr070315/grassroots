import { ref } from 'vue'
import * as ort from 'onnxruntime-web'
// 用 ?url 让 Vite 把 jsep 的 wasm 模块作为静态资源暴露，避免动态 import public 目录下的 .mjs 被拦截
import ortWasmMjsUrl from 'onnxruntime-web/ort-wasm-simd-threaded.jsep.mjs?url'
import ortWasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.jsep.wasm?url'

// ---------- 常量 ----------
const MODEL_PATH = '/models/model_int8.onnx'
const THRESHOLDS_PATH = '/models/thresholds.json'
const INPUT_SIZE = 384
// 输出通道顺序必须与模型训练时的类别顺序一致
const LABELS = ['DR', 'ARMD', 'glaucoma', 'myopia']
const NAME_MAP = {
  DR: '糖尿病视网膜病变',
  ARMD: '年龄相关性黄斑变性',
  glaucoma: '青光眼',
  myopia: '病理性近视'
}
// 低置信度提示阈值（margin 小于该值时提示医生复核）
const LOW_CONFIDENCE_MARGIN = 0.05

// ---------- 配置 wasm 路径 ----------
// 显式指定 mjs 与 wasm 的静态资源 URL
ort.env.wasm.wasmPaths = { mjs: ortWasmMjsUrl, wasm: ortWasmUrl }

let sessionPromise = null
let thresholdsPromise = null

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x))
}

function loadThresholds() {
  if (!thresholdsPromise) {
    thresholdsPromise = fetch(THRESHOLDS_PATH)
      .then((res) => {
        if (!res.ok) throw new Error(`thresholds.json 加载失败: ${res.status}`)
        return res.json()
      })
  }
  return thresholdsPromise
}

async function loadSession() {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      // INT8 静态量化模型走 CPU wasm 执行
      const session = await ort.InferenceSession.create(MODEL_PATH, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all'
      })
      return session
    })().catch((err) => {
      // 失败后清空缓存，允许重试
      sessionPromise = null
      throw err
    })
  }
  return sessionPromise
}

/**
 * 加载图片元素 -> HTMLImageElement（解决 EXIF 方向与解码问题）
 */
function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片解析失败'))
    img.src = source
  })
}

/**
 * 居中裁剪（cover）到 384x384，提取像素做 TF-style 归一化，
 * 输出 [1, 3, 384, 384] CHW 的 Float32Array Tensor。
 */
function preprocess(imgEl) {
  const size = INPUT_SIZE
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  const iw = imgEl.naturalWidth || imgEl.width
  const ih = imgEl.naturalHeight || imgEl.height
  const side = Math.min(iw, ih)
  const sx = (iw - side) / 2
  const sy = (ih - side) / 2
  ctx.drawImage(imgEl, sx, sy, side, side, 0, 0, size, size)

  const { data } = ctx.getImageData(0, 0, size, size)
  const planes = size * size
  const chw = new Float32Array(3 * planes)

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    // TF-style 归一化：(x/255 - 0.5) / 0.5 => 映射到 [-1, 1]
    chw[p] = (r / 255 - 0.5) / 0.5
    chw[planes + p] = (g / 255 - 0.5) / 0.5
    chw[2 * planes + p] = (b / 255 - 0.5) / 0.5
  }

  // 释放 canvas 引用，便于 GC
  canvas.width = 0
  canvas.height = 0
  return new ort.Tensor('float32', chw, [1, 3, size, size])
}

/**
 * 结果后处理：logits -> sigmoid 概率 -> 结合阈值生成结构化结果
 */
function postprocess(logits, thresholds) {
  return LABELS.map((key, idx) => {
    const probability = sigmoid(logits[idx])
    const threshold = thresholds[key]
    const suspicious = probability >= threshold
    const margin = Math.abs(probability - threshold)
    return {
      key,
      name: NAME_MAP[key],
      probability,
      threshold,
      suspicious,
      margin,
      lowConfidence: margin < LOW_CONFIDENCE_MARGIN
    }
  })
}

/**
 * Vue 3 Composable：暴露给页面的推理入口
 */
export function useFundusAI() {
  const loading = ref(false)
  const error = ref(null)
  const modelReady = ref(false)

  async function init() {
    try {
      await loadSession()
      await loadThresholds()
      modelReady.value = true
    } catch (e) {
      error.value = e
      throw e
    }
  }

  /**
   * @param {string} source 图片 dataURL（base64），可来自文件或摄像头
   * @returns {Promise<Array>} 结构化筛查结果数组
   */
  async function screen(source) {
    loading.value = true
    error.value = null
    let inputTensor = null
    let outputTensor = null
    try {
      const [session, thresholds] = await Promise.all([loadSession(), loadThresholds()])
      const img = await loadImage(source)
      inputTensor = preprocess(img)

      const feeds = { [session.inputNames[0]]: inputTensor }
      const results = await session.run(feeds)
      outputTensor = results[session.outputNames[0]]

      // logits 转一维数组
      const logits = Array.from(outputTensor.data)
      return postprocess(logits, thresholds)
    } catch (e) {
      error.value = e
      throw e
    } finally {
      // 及时释放 GPU/内存
      inputTensor?.dispose?.()
      outputTensor?.dispose?.()
      loading.value = false
    }
  }

  return { loading, error, modelReady, init, screen }
}