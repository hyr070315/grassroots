import { reactive } from 'vue'

// 页面间共享的筛查状态（单例）
export const screening = reactive({
  image: null, // 原图 dataURL（base64）
  result: null // 后处理结果数组
})