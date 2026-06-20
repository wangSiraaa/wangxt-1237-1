<template>
  <n-layout has-sider bordered style="min-height: 100vh;">
    <n-layout-sider
      :bordered="false"
      collapse-mode="width"
      :collapsed-width="64"
      :width="220"
      :native-scrollbar="false"
      show-trigger="bar"
      background-color="#1f2937"
      style="height: 100vh;"
    >
      <div class="logo-area">
        <div class="logo-icon">
          <n-icon size="28" color="#fff">
            <FlashOutline />
          </n-icon>
        </div>
        <div v-if="!collapsed" class="logo-text">应急油机保障</div>
      </div>
      <n-menu
        v-model:value="activeKey"
        v-model:collapsed="collapsed"
        :collapsed-width="64"
        :collapsed="collapsed"
        :options="menuOptions"
        :render-label="renderMenuLabel"
        :expand-icon="expandIcon"
      />
    </n-layout-sider>

    <n-layout>
      <n-layout-header bordered class="layout-header">
        <div class="header-left">
          <n-icon size="20" class="menu-icon">
            <MenuOutline />
          </n-icon>
          <n-breadcrumb class="breadcrumb">
            <n-breadcrumb-item v-for="(item, index) in breadcrumb" :key="index">
              {{ item }}
            </n-breadcrumb-item>
          </n-breadcrumb>
        </div>
        <div class="header-right">
          <n-space>
            <n-tag size="small" type="info">网管人员</n-tag>
            <n-avatar size="small" round>
              {{ '管理员'.slice(0, 1) }}
            </n-avatar>
          </n-space>
        </div>
      </n-layout-header>
      <n-layout-content content-style="padding: 0; min-height: calc(100vh - 64px);">
        <router-view />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup>
import { ref, computed, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NIcon } from 'naive-ui'
import {
  BarChartOutline,
  BusinessOutline,
  FlashOutline,
  PaperPlaneOutline,
  WaterOutline,
  CheckmarkCircleOutline,
  MenuOutline,
  ChevronForward,
} from '@vicons/ionicons5'

const router = useRouter()
const route = useRoute()
const collapsed = ref(false)
const activeKey = ref(route.path)

const menuOptions = [
  {
    label: '数据概览',
    key: '/dashboard',
    icon: () => h(BarChartOutline),
  },
  {
    label: '基站管理与停电告警',
    key: '/stations',
    icon: () => h(BusinessOutline),
  },
  {
    label: '油机与油桶管理',
    key: '/generators',
    icon: () => h(FlashOutline),
  },
  {
    label: '派单与执行',
    key: '/dispatch',
    icon: () => h(PaperPlaneOutline),
  },
  {
    label: '燃油消耗与异常',
    key: '/fuel',
    icon: () => h(WaterOutline),
  },
  {
    label: '恢复确认',
    key: '/recovery',
    icon: () => h(CheckmarkCircleOutline),
  },
]

const breadcrumb = computed(() => {
  const matched = menuOptions.find(m => m.key === route.path)
  return ['首页', matched ? matched.label : '']
})

function renderMenuLabel(option) {
  if (typeof option.label === 'string') {
    return option.label
  }
  return option.label
}

function expandIcon() {
  return h(ChevronForward)
}

router.afterEach((to) => {
  activeKey.value = to.path
})
</script>

<style scoped lang="scss">
.logo-area {
  display: flex;
  align-items: center;
  height: 64px;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  gap: 12px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #18a058, #2080f0);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-text {
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
}

.layout-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #fff;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.menu-icon {
  color: #666;
  cursor: pointer;
}

.breadcrumb {
  margin-left: 8px;
}

.header-right {
  display: flex;
  align-items: center;
}
</style>
