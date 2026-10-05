<template>
  <div class="mx-auto flex min-h-screen max-w-5xl flex-col px-8 py-12">
    <header class="mb-10">
      <div class="mb-3 flex items-center gap-2 text-sm text-apple-sub">
        <span class="h-1.5 w-1.5 rounded-full" :class="modelReady ? 'bg-apple-success' : 'bg-apple-warn'"></span>
        {{ modelReady ? '模型已就绪' : '模型加载中…' }}
      </div>
      <h1 class="text-3xl font-semibold tracking-tight text-apple-text">基层眼底筛查</h1>
      <p class="mt-2 text-base text-apple-sub">上传眼底照片，AI 辅助初筛 DR / ARMD / 青光眼 / 近视</p>
    </header>

    <main class="grid flex-1 gap-6 lg:grid-cols-2">
      <section class="flex flex-col">
        <el-upload
          drag
          :auto-upload="false"
          :show-file-list="false"
          accept="image/*"
          :on-change="onFileChange"
          class="flex-1"
        >
          <div class="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 p-10">
            <div class="flex h-14 w-14 items-center justify-center rounded-xl bg-apple-surface">
              <el-icon :size="24" color="#6E6E73"><UploadFilled /></el-icon>
            </div>
            <p class="text-lg font-medium text-apple-text">拖拽眼底照片到此处</p>
            <p class="text-sm text-apple-sub">或点击选择本地图片 · JPG / PNG</p>
          </div>
        </el-upload>

        <el-button class="apple-btn-secondary mt-4" @click="triggerCamera">
          <el-icon class="mr-1.5"><Camera /></el-icon>
          调用摄像头拍照
        </el-button>
        <input
          ref="cameraInput"
          type="file"
          accept="image/*"
          capture="environment"
          class="hidden"
          @change="onCameraChange"
        />
      </section>

      <section class="flex flex-col">
        <div class="flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-apple-border bg-white">
          <img v-if="preview" :src="preview" alt="预览图" class="max-h-[460px] w-auto object-contain" />
          <div v-else class="flex flex-col items-center gap-3 text-apple-sub">
            <div class="flex h-14 w-14 items-center justify-center rounded-xl bg-apple-surface">
              <el-icon :size="24"><Picture /></el-icon>
            </div>
            <p class="text-sm">图片预览区</p>
          </div>
        </div>

        <button class="apple-btn-primary mt-4" :disabled="!preview || loading" @click="onStart">
          <span v-if="loading" class="inline-flex items-center justify-center gap-2">
            <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
            正在分析…
          </span>
          <span v-else>开始 AI 筛查</span>
        </button>
      </section>
    </main>

    <el-alert
      v-if="error"
      :title="error.message || String(error)"
      type="error"
      show-icon
      class="mt-6"
      :closable="false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UploadFilled, Camera, Picture } from '@element-plus/icons-vue'
import { useFundusAI } from '@/composables/use_fundus_ai.js'
import { screening } from '@/store.js'

const router = useRouter()
const { loading, error, modelReady, init, screen } = useFundusAI()

const preview = ref('')
const cameraInput = ref(null)

onMounted(() => {
  init().catch(() => {})
})

function toDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

async function onFileChange(uploadFile) {
  try {
    preview.value = await toDataURL(uploadFile.raw)
  } catch (e) {
    ElMessage.error(e.message)
  }
}

function triggerCamera() {
  cameraInput.value?.click()
}

async function onCameraChange(e) {
  const file = e.target.files?.[0]
  if (file) {
    preview.value = await toDataURL(file)
  }
  e.target.value = ''
}

async function onStart() {
  try {
    const result = await screen(preview.value)
    screening.image = preview.value
    screening.result = result
    router.push('/result')
  } catch (e) {
    ElMessage.error(`AI 筛查失败：${e.message || e}`)
  }
}
</script>

<style scoped>
.apple-btn-primary {
  height: 48px;
  width: 100%;
  border-radius: 10px;
  background: #0066cc;
  color: #fff;
  font-size: 0.9375rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}
.apple-btn-primary:hover:not(:disabled) {
  background: #0052a3;
}
.apple-btn-primary:active:not(:disabled) {
  transform: scale(0.99);
}
.apple-btn-primary:disabled {
  background: #d2d2d7;
  cursor: not-allowed;
}

:deep(.apple-btn-secondary) {
  height: 44px;
  border-radius: 10px !important;
  background: #ffffff !important;
  color: #1d1d1f !important;
  border: 1px solid #e5e5ea !important;
  font-size: 0.9375rem !important;
  font-weight: 500 !important;
  box-shadow: none !important;
  transition: all 0.2s ease !important;
}
:deep(.apple-btn-secondary:hover) {
  background: #f5f5f7 !important;
}

:deep(.el-upload),
:deep(.el-upload-dragger) {
  width: 100% !important;
  height: 100% !important;
  border: 1px solid #e5e5ea !important;
  background: #ffffff !important;
  border-radius: 16px !important;
  box-shadow: none !important;
  transition: all 0.2s ease !important;
}
:deep(.el-upload) {
  display: block;
}
:deep(.el-upload-dragger:hover) {
  border-color: #0066cc !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.05) !important;
}
</style>