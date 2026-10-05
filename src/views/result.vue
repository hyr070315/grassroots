<template>
  <div class="mx-auto flex min-h-screen max-w-5xl flex-col px-8 py-12">
    <header class="mb-8 flex items-center justify-between border-b border-apple-border pb-5">
      <div class="flex items-center gap-4">
        <button class="apple-icon-btn" @click="router.push('/upload')">
          <el-icon :size="18"><ArrowLeft /></el-icon>
        </button>
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-apple-text">AI 筛查结果</h1>
          <p class="mt-0.5 text-sm text-apple-sub">仅供医生辅助参考 · 不替代临床诊断</p>
        </div>
      </div>
      <div
        class="flex items-center gap-2 text-sm font-medium"
        :class="hasSuspicious ? 'text-apple-danger' : 'text-apple-success'"
      >
        <span class="h-1.5 w-1.5 rounded-full" :class="hasSuspicious ? 'bg-apple-danger' : 'bg-apple-success'"></span>
        {{ hasSuspicious ? '发现可疑指标' : '未见明显异常' }}
      </div>
    </header>

    <main v-if="image && result" class="grid flex-1 gap-6 lg:grid-cols-[5fr_7fr]">
      <!-- 左侧：原图 + 热力图 -->
      <section class="flex flex-col">
        <div class="relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-apple-border bg-black">
          <img :src="image" alt="眼底原图" class="h-full w-full object-contain" />
          <img
            v-show="showHeatmap"
            :src="heatmapSrc"
            alt="热力图"
            class="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-screen transition-opacity duration-500"
          />
        </div>
        <div class="mt-4 flex items-center justify-between rounded-xl border border-apple-border bg-white px-4 py-3">
          <div>
            <p class="text-sm font-medium text-apple-text">Grad-CAM++ 热力图</p>
            <p class="text-xs text-apple-sub">叠加可解释性热力图辅助判读</p>
          </div>
          <el-switch v-model="showHeatmap" />
        </div>
      </section>

      <!-- 右侧：四病种卡片 -->
      <section class="flex flex-col gap-4">
        <div
          v-for="item in result"
          :key="item.key"
          class="rounded-2xl border border-apple-border bg-white p-5 transition-shadow duration-200 hover:shadow-apple-sm"
        >
          <div class="mb-3 flex items-baseline justify-between">
            <div class="flex items-baseline gap-2">
              <span class="text-lg font-semibold text-apple-text">{{ item.name }}</span>
              <span class="text-xs font-medium uppercase tracking-wider text-apple-sub">{{ item.key }}</span>
            </div>
            <span
              class="text-xs font-medium"
              :class="item.suspicious ? 'text-apple-danger' : 'text-apple-success'"
            >
              {{ item.suspicious ? '可疑' : '正常' }}
            </span>
          </div>

          <!-- 风险条 + 阈值标线 -->
          <div class="relative mb-2 h-1.5 w-full rounded-full bg-apple-surface">
            <div
              class="h-1.5 rounded-full transition-all duration-500"
              :class="item.suspicious ? 'bg-apple-danger' : 'bg-apple-blue'"
              :style="{ width: Math.min(item.probability * 100, 100) + '%' }"
            ></div>
            <div
              class="absolute -top-1 h-3.5 w-px bg-apple-text/70"
              :style="{ left: item.threshold * 100 + '%' }"
              :title="'阈值 ' + (item.threshold * 100).toFixed(0) + '%'"
            ></div>
          </div>

          <div class="flex items-center justify-between text-xs text-apple-sub">
            <span>概率 <span class="font-semibold tabular-nums text-apple-text">{{ (item.probability * 100).toFixed(1) }}%</span></span>
            <span>阈值 <span class="font-semibold tabular-nums text-apple-text">{{ (item.threshold * 100).toFixed(0) }}%</span></span>
          </div>

          <div v-if="item.lowConfidence" class="mt-3 flex items-center gap-1.5 text-xs text-apple-warn">
            <el-icon :size="13"><WarningFilled /></el-icon>
            <span>低置信度（Δ {{ (item.margin * 100).toFixed(1) }}%），建议重点复核</span>
          </div>
        </div>
      </section>
    </main>

    <!-- 空状态 -->
    <div v-if="!image || !result" class="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-apple-sub">
      <el-icon :size="48"><Picture /></el-icon>
      <p class="text-base">暂无筛查结果，请先上传图片</p>
      <button class="apple-link mt-1" @click="router.push('/upload')">返回上传 →</button>
    </div>

    <!-- 底部操作 -->
    <footer v-show="image && result" class="mt-8 flex items-center justify-end gap-3 border-t border-apple-border pt-6">
      <button class="apple-btn-ghost" @click="onClear">
        <el-icon class="mr-1.5"><CircleCheck /></el-icon>
        排除异常
      </button>
      <button class="apple-btn-danger" @click="onRefer">
        <el-icon class="mr-1.5"><Promotion /></el-icon>
        确认转诊
      </button>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Promotion, CircleCheck, WarningFilled, Picture } from '@element-plus/icons-vue'
import { screening } from '@/store.js'

const router = useRouter()
const image = computed(() => screening.image)
const result = computed(() => screening.result)
const showHeatmap = ref(false)
const heatmapSrc = '/models/heatmap_demo.svg'

const hasSuspicious = computed(() => result.value?.some((r) => r.suspicious) ?? false)

function onRefer() {
  ElMessage.success('已提交转诊申请')
  // TODO: 对接后端转诊接口 /api/referral
}

function onClear() {
  ElMessage.success('已标记排除异常')
  screening.image = null
  screening.result = null
  router.push('/upload')
}
</script>

<style scoped>
.apple-icon-btn {
  height: 36px;
  width: 36px;
  border-radius: 8px;
  background: #f5f5f7;
  color: #1d1d1f;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  cursor: pointer;
}
.apple-icon-btn:hover {
  background: #e5e5ea;
}

.apple-link {
  color: #0066cc;
  font-size: 0.875rem;
  font-weight: 500;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.apple-link:hover {
  color: #0052a3;
  text-decoration: underline;
}

.apple-btn-ghost {
  height: 44px;
  padding: 0 1.25rem;
  border-radius: 10px;
  background: #ffffff;
  color: #1d1d1f;
  border: 1px solid #e5e5ea;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.apple-btn-ghost:hover {
  background: #f5f5f7;
}

.apple-btn-danger {
  height: 44px;
  padding: 0 1.5rem;
  border-radius: 10px;
  background: #c5342e;
  color: #fff;
  border: none;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(197, 52, 46, 0.2);
}
.apple-btn-danger:hover {
  background: #a82820;
}
.apple-btn-danger:active {
  transform: scale(0.98);
}
</style>