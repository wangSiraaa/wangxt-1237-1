<template>
  <div class="page-wrapper">
    <div class="page-header">
      <h2 class="page-title">数据概览</h2>
      <n-space>
        <n-button @click="loadStatistics" :loading="loading">
          <template #icon><RefreshOutline /></template>
          刷新数据
        </n-button>
      </n-space>
    </div>

    <div class="stat-cards">
      <div class="stat-card">
        <div class="label">基站总数</div>
        <div class="value">{{ stats.station?.total || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">停电基站</div>
        <div class="value warning">{{ stats.station?.powerOut || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">发电中</div>
        <div class="value">{{ stats.station?.generating || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">核心站点待派单</div>
        <div class="value core">{{ corePendingCount || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">油机总数 / 空闲</div>
        <div class="value">{{ stats.generator?.total || 0 }} / {{ stats.generator?.idle || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">未归还油机</div>
        <div class="value warning">{{ stats.order?.notReturned || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">燃油异常记录</div>
        <div class="value warning">{{ stats.fuel?.abnormalCount || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">待经理确认恢复</div>
        <div class="value core">{{ stats.recovery?.pending || 0 }}</div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 16px;">
      <div class="table-card">
        <h3 class="section-title">核心站点待派单列表（红色高亮）</h3>
        <n-data-table
          :columns="coreStationColumns"
          :data="corePendingStations"
          :pagination="false"
          :row-class-name="coreRowClass"
          size="small"
        />
        <n-empty v-if="!corePendingStations.length" description="暂无核心站点待派单" />
      </div>

      <div class="table-card">
        <h3 class="section-title">待归还油机</h3>
        <n-data-table
          :columns="returnColumns"
          :data="pendingReturnList"
          :pagination="false"
          size="small"
        />
        <n-empty v-if="!pendingReturnList.length" description="暂无待归还油机" />
      </div>
    </div>

    <div class="table-card" style="margin-top: 16px;">
      <h3 class="section-title">燃油消耗异常（需上传现场照片说明）</h3>
      <n-data-table
        :columns="abnormalFuelColumns"
        :data="abnormalFuelList"
        :pagination="false"
        size="small"
      />
      <n-empty v-if="!abnormalFuelList.length" description="暂无燃油异常记录" />
    </div>

    <div class="table-card" style="margin-top: 16px;">
      <h3 class="section-title">待区域经理确认恢复</h3>
      <n-data-table
        :columns="recoveryColumns"
        :data="pendingRecoveryList"
        :pagination="false"
        size="small"
        :row-class-name="recoveryRowClass"
      />
      <n-empty v-if="!pendingRecoveryList.length" description="暂无待确认恢复记录" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NIcon, NTag } from 'naive-ui'
import { RefreshOutline, ArrowForwardOutline } from '@vicons/ionicons5'
import { getStationStatistics } from '../api/station'
import { getGeneratorStatistics } from '../api/generator'
import { getDispatchOrderStatistics, getDispatchOrderList, getPendingDispatchList } from '../api/dispatch'
import { getFuelStatistics, getFuelRecordList } from '../api/fuel'
import { getRecoveryStatistics, getRecoveryList } from '../api/recovery'
import { levelOptions, stationStatusOptions, orderStatusOptions } from '../utils/constants'

const router = useRouter()
const loading = ref(false)
const stats = ref({})
const corePendingStations = ref([])
const pendingReturnList = ref([])
const abnormalFuelList = ref([])
const pendingRecoveryList = ref([])

const corePendingCount = computed(() => {
  return stats.value.recovery?.corePending || corePendingStations.value.filter(s => s.needHighlight).length
})

const coreStationColumns = [
  { title: '基站编码', key: 'stationCode', width: 130 },
  { title: '基站名称', key: 'stationName' },
  { title: '级别', key: 'stationLevel', width: 90, render: (r) => {
    const opt = levelOptions.find(o => o.value === r.stationLevel)
    return h(NTag, { type: r.stationLevel === 'core' ? 'error' : r.stationLevel === 'important' ? 'warning' : 'default', size: 'small' }, { default: () => opt?.label || r.stationLevel })
  }},
  { title: '区域', key: 'region', width: 100 },
  { title: '负责人', key: 'manager', width: 90 },
  { title: '联系电话', key: 'managerPhone', width: 120 },
  { title: '是否已派单', key: 'isDispatched', width: 110, render: (r) => h(NTag, { type: r.isDispatched ? 'success' : 'error', size: 'small' }, { default: () => r.isDispatched ? '已派单' : '未派单' })},
  { title: '操作', key: 'action', width: 110, fixed: 'right', render: (r) => h(NButton, { size: 'small', type: 'primary', onClick: () => router.push('/dispatch') }, { default: () => '去派单' })},
]

const returnColumns = [
  { title: '派单号', key: 'orderNo', width: 180 },
  { title: '油机', key: 'generatorCode', width: 120, render: (r) => (r.generatorCode || '-') + ' ' + (r.generatorName || '')},
  { title: '基站', key: 'stationName', width: 120, ellipsis: { tooltip: true }},
  { title: '状态', key: 'status', width: 90, render: (r) => {
    const opt = orderStatusOptions.find(o => o.value === r.status)
    return h(NTag, { size: 'small', type: 'warning' }, { default: () => opt?.label || r.status })
  }},
]

const abnormalFuelColumns = [
  { title: '记录ID', key: 'id', width: 80 },
  { title: '关联派单', key: 'orderNo', width: 160, render: (r) => r.order?.orderNo || '-' },
  { title: '实际消耗', key: 'consumption', width: 100, render: (r) => `${r.consumption}L` },
  { title: '标准消耗', key: 'standardConsumption', width: 100, render: (r) => `${r.standardConsumption}L` },
  { title: '偏差', key: 'deviation', width: 90, render: (r) => {
    const dev = r.standardConsumption > 0 ? Math.round(Math.abs(r.consumption - r.standardConsumption) / r.standardConsumption * 100) : 0
    return h(NTag, { type: dev > 30 ? 'error' : 'warning', size: 'small' }, { default: () => `${dev}%` })
  }},
  { title: '是否已解释', key: 'abnormalStatus', width: 100, render: (r) => h(NTag, { type: r.abnormalStatus === 'explained' ? 'success' : 'error', size: 'small' }, { default: () => r.abnormalStatus === 'explained' ? '已说明' : '待说明' })},
  { title: '操作', key: 'action', width: 110, render: () => h(NButton, { size: 'small', onClick: () => router.push('/fuel') }, { default: () => '去处理' })},
]

const recoveryColumns = [
  { title: '确认ID', key: 'id', width: 80 },
  { title: '派单号', key: 'orderNo', width: 160 },
  { title: '基站编码', key: 'stationCode', width: 120 },
  { title: '基站名称', key: 'stationName' },
  { title: '维护人员', key: 'maintainer', width: 100 },
  { title: '操作', key: 'action', width: 110, render: () => h(NButton, { size: 'small', type: 'primary', onClick: () => router.push('/recovery') }, { default: () => '去确认' })},
]

function coreRowClass(row) {
  return row.needHighlight ? 'core-row' : ''
}

function recoveryRowClass(row) {
  return row.needHighlight ? 'core-row' : ''
}

async function loadStatistics() {
  loading.value = true
  try {
    const [station, generator, order, fuel, recovery, pendingList, orders, fuels, recoveries] = await Promise.all([
      getStationStatistics(),
      getGeneratorStatistics(),
      getDispatchOrderStatistics(),
      getFuelStatistics(),
      getRecoveryStatistics(),
      getPendingDispatchList(),
      getDispatchOrderList({ page: 1, pageSize: 100, status: 'generating' }),
      getFuelRecordList({ page: 1, pageSize: 100, abnormalStatus: 'abnormal' }),
      getRecoveryList({ page: 1, pageSize: 100, needManagerConfirm: 'true' }),
    ])
    stats.value = { station, generator, order, fuel, recovery }
    corePendingStations.value = pendingList
    pendingReturnList.value = (orders.list || []).filter(o => !o.generatorReturned)
    abnormalFuelList.value = fuels.list || []
    pendingRecoveryList.value = recoveries.list || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadStatistics)
</script>
