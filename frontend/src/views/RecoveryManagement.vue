<template>
  <div class="page-wrapper">
    <div class="page-header">
      <h2 class="page-title">恢复确认管理</h2>
      <n-space>
        <n-button @click="loadData">
          <template #icon><RefreshOutline /></template>
          刷新
        </n-button>
        <n-button type="primary" @click="openCreateModal">
          <template #icon><AddOutline /></template>
          申请恢复确认
        </n-button>
      </n-space>
    </div>

    <div class="stat-cards">
      <div class="stat-card">
        <div class="label">记录总数</div>
        <div class="value">{{ stats.total || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">待经理确认</div>
        <div class="value core">{{ stats.pending || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">核心站点待确认</div>
        <div class="value core">{{ stats.corePending || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">已确认恢复</div>
        <div class="value" style="color:#18a058">{{ stats.confirmed || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">平均发电时长</div>
        <div class="value">{{ stats.avgDuration || 0 }}h</div>
      </div>
      <div class="stat-card">
        <div class="label">累计燃油消耗</div>
        <div class="value">{{ stats.totalFuel || 0 }}L</div>
      </div>
    </div>

    <n-tabs v-model:value="activeTab" type="line">
      <n-tab-pane name="pending" tab="待确认（核心站点红色高亮）">
        <div class="table-card">
          <n-data-table
            :columns="pendingColumns"
            :data="pendingList"
            :loading="loading"
            :row-key="(row) => row.id"
            :row-class-name="pendingRowClass"
            :pagination="false"
            size="small"
          />
          <n-empty v-if="!pendingList.length" description="暂无待确认记录" />
        </div>
      </n-tab-pane>
      <n-tab-pane name="all" tab="全部记录">
        <div class="toolbar">
          <n-input v-model:value="searchForm.keyword" placeholder="搜索派单号/基站" clearable style="width: 260px;" @keyup.enter="loadData">
            <template #prefix><SearchOutline /></template>
          </n-input>
          <n-select v-model:value="searchForm.status" placeholder="确认状态" clearable :options="recoveryStatusOptions" style="width: 140px;" />
          <div class="spacer"></div>
          <n-button @click="loadData"><template #icon><SearchOutline /></template>查询</n-button>
        </div>
        <div class="table-card">
          <n-data-table
            :columns="allColumns"
            :data="allList"
            :loading="loading"
            :row-key="(row) => row.id"
            :row-class-name="allRowClass"
            :pagination="pagination"
            @update:page="(p) => { searchForm.page = p; loadData() }"
            @update:page-size="(s) => { searchForm.pageSize = s; loadData() }"
          />
        </div>
      </n-tab-pane>
    </n-tabs>

    <n-modal v-model:show="createModalShow" preset="card" style="width: 620px;" title="申请恢复确认">
      <n-alert type="info" style="margin-bottom: 16px;">
        电力恢复后，维护人员需提交恢复确认申请，由区域经理进行审核确认
      </n-alert>
      <n-form :model="createForm" label-placement="left" label-width="120px">
        <n-form-item label="选择派单" required>
          <n-select
            v-model:value="createForm.orderId"
            :options="generatingOrders"
            filterable
            placeholder="请选择发电中的派单（油机必须已归还）"
          />
        </n-form-item>
        <n-form-item label="电力恢复时间" required>
          <n-date-picker v-model:value="createForm.powerRestoredTime" type="datetime" style="width: 100%;" />
        </n-form-item>
        <n-form-item label="油机停机时间" required>
          <n-date-picker v-model:value="createForm.generatorStopTime" type="datetime" style="width: 100%;" />
        </n-form-item>
        <n-form-item label="燃油消耗总量(L)">
          <n-input-number v-model:value="createForm.totalFuelConsumption" :min="0" :step="0.1" style="width: 100%;" />
        </n-form-item>
        <n-form-item label="维护人员" required>
          <n-input v-model:value="createForm.maintainer" placeholder="请输入现场维护人员" />
        </n-form-item>
        <n-form-item label="现场照片">
          <div>
            <n-upload
              :max="5"
              list-type="image-card"
              accept="image/*"
              :custom-request="handleUploadPhoto"
              v-model:file-list="createPhotoList"
            />
            <div v-if="createForm.photoUrl && !createPhotoList.length" style="margin-top: 8px;">
              已有照片：<img :src="createForm.photoUrl" class="photo-preview" @click="previewImage(createForm.photoUrl)" />
            </div>
          </div>
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="createForm.remark" type="textarea" :rows="3" placeholder="现场情况说明等" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="createModalShow = false">取消</n-button>
          <n-button type="primary" @click="submitCreate">提交申请</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="confirmModalShow" preset="card" style="width: 640px;" title="区域经理恢复确认">
      <div style="background: #f7f8fa; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
        <h4 style="margin: 0 0 12px 0; color: #1f1f1f;">恢复确认详情</h4>
        <div class="info-grid">
          <div class="info-item"><span class="info-label">派单号</span><span class="info-value">{{ confirmRecord.orderNo || '-' }}</span></div>
          <div class="info-item"><span class="info-label">基站编码</span><span class="info-value">{{ confirmRecord.stationCode || '-' }}</span></div>
          <div class="info-item"><span class="info-label">基站名称</span><span class="info-value">{{ confirmRecord.stationName || '-' }}</span></div>
          <div class="info-item">
            <span class="info-label">站点级别</span>
            <span class="info-value">
              <n-tag
                size="small"
                :type="confirmRecord.stationLevel === 'core' ? 'error' : confirmRecord.stationLevel === 'important' ? 'warning' : 'default'"
              >
                {{ levelOptions.find(l => l.value === confirmRecord.stationLevel)?.label || confirmRecord.stationLevel }}
              </n-tag>
            </span>
          </div>
          <div class="info-item"><span class="info-label">电力恢复时间</span><span class="info-value">{{ formatTime(confirmRecord.powerRestoredTime) }}</span></div>
          <div class="info-item"><span class="info-label">油机停机时间</span><span class="info-value">{{ formatTime(confirmRecord.generatorStopTime) }}</span></div>
          <div class="info-item"><span class="info-label">发电时长</span><span class="info-value">{{ confirmRecord.totalGenerateDuration || 0 }} 小时</span></div>
          <div class="info-item"><span class="info-label">燃油消耗</span><span class="info-value">{{ confirmRecord.totalFuelConsumption || 0 }} L</span></div>
          <div class="info-item"><span class="info-label">维护人员</span><span class="info-value">{{ confirmRecord.maintainer || '-' }}</span></div>
          <div class="info-item"><span class="info-label">提交时间</span><span class="info-value">{{ formatTime(confirmRecord.maintainerConfirmTime) }}</span></div>
        </div>
        <div v-if="confirmRecord.photoUrl" style="margin-top: 12px;">
          <div style="font-size: 13px; color: #8c8c8c; margin-bottom: 6px;">现场照片：</div>
          <img :src="confirmRecord.photoUrl" class="photo-preview" style="width: 160px; height: 120px;" @click="previewImage(confirmRecord.photoUrl)" />
        </div>
      </div>

      <n-form :model="confirmForm" label-placement="left" label-width="120px">
        <n-form-item label="区域经理" required>
          <n-input v-model:value="confirmForm.regionalManager" placeholder="请输入区域经理姓名" />
        </n-form-item>
        <n-form-item label="审核意见" required>
          <n-input v-model:value="confirmForm.managerRemark" type="textarea" :rows="3" placeholder="请输入审核意见" />
        </n-form-item>
      </n-form>

      <template #footer>
        <n-space justify="end">
          <n-button @click="confirmModalShow = false">取消</n-button>
          <n-button type="error" @click="doConfirm(false)">
            <template #icon><CloseOutline /></template>
            驳回
          </n-button>
          <n-button type="success" @click="doConfirm(true)">
            <template #icon><CheckmarkDoneOutline /></template>
            确认恢复
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, h, watch } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { NButton, NTag, NIcon, NTooltip, NPopconfirm } from 'naive-ui'
import {
  AddOutline, RefreshOutline, SearchOutline, CheckmarkDoneOutline,
  CloseOutline, EyeOutline, TrashOutline, AlertCircleOutline,
} from '@vicons/ionicons5'
import {
  getRecoveryList, getRecoveryDetail, getRecoveryStatistics,
  createRecoveryFromOrder, managerConfirmRecovery, deleteRecovery,
} from '../api/recovery'
import { getDispatchOrderList } from '../api/dispatch'
import { uploadImage } from '../api/upload'
import { levelOptions, recoveryStatusOptions } from '../utils/constants'
import dayjs from 'dayjs'

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const stats = ref({})
const activeTab = ref('pending')
const pendingList = ref([])
const allList = ref([])
const generatingOrders = ref([])

const searchForm = reactive({ keyword: '', status: null, page: 1, pageSize: 20 })
const pagination = reactive({ page: 1, pageSize: 20, itemCount: 0, showSizePicker: true, pageSizes: [10, 20, 50, 100] })

const createModalShow = ref(false)
const createForm = reactive({
  orderId: null, powerRestoredTime: null, generatorStopTime: null,
  totalFuelConsumption: 0, maintainer: '', photoUrl: '', remark: '',
})
const createPhotoList = ref([])

const confirmModalShow = ref(false)
const currentRecordId = ref(null)
const confirmRecord = ref({})
const confirmForm = reactive({ regionalManager: '', managerRemark: '' })

function formatTime(t) {
  if (!t) return '-'
  return dayjs(t).format('YYYY-MM-DD HH:mm:ss')
}

function renderStatusTag(value) {
  const opt = recoveryStatusOptions.find(o => o.value === value)
  return h(NTag, { type: opt?.type || 'default', size: 'small' }, { default: () => opt?.label || value })
}

function renderLevelTag(value) {
  const opt = levelOptions.find(o => o.value === value)
  return h(NTag, { type: opt?.type || 'default', size: 'small' }, { default: () => opt?.label || value })
}

const pendingColumns = [
  { title: '派单号', key: 'orderNo', width: 180 },
  { title: '基站编码', key: 'stationCode', width: 130 },
  {
    title: '基站名称/级别', key: 'station', width: 260,
    render: (r) => h('div', [
      h('div', { style: { fontWeight: 500 } }, r.stationName),
      h('div', { style: { marginTop: '2px' } }, renderLevelTag(r.stationLevel)),
    ]),
  },
  { title: '发电时长', key: 'totalGenerateDuration', width: 100, render: (r) => `${r.totalGenerateDuration || 0}h` },
  { title: '燃油消耗', key: 'totalFuelConsumption', width: 100, render: (r) => `${r.totalFuelConsumption || 0}L` },
  { title: '维护人员', key: 'maintainer', width: 100 },
  { title: '提交时间', key: 'maintainerConfirmTime', width: 160, render: (r) => formatTime(r.maintainerConfirmTime) },
  {
    title: '状态', key: 'status', width: 100,
    render: (r) => r.needHighlight
      ? h('div', { style: { display: 'flex', alignItems: 'center', gap: '4px' } }, [
          h(NIcon, { size: 16, style: { color: '#d03050' } }, { default: () => h(AlertCircleOutline) }),
          renderStatusTag(r.status),
        ])
      : renderStatusTag(r.status),
  },
  {
    title: '操作', key: 'action', width: 160, fixed: 'right',
    render: (r) => h('div', { style: { display: 'flex', gap: '6px' } }, [
      h(NButton, {
        size: 'small', type: r.needHighlight ? 'error' : 'primary',
        onClick: () => openConfirmModal(r),
      }, { default: () => '经理确认' }),
      h(NTooltip, null, {
        trigger: () => h(NButton, { size: 'small', onClick: () => viewOne(r.id) }, { default: () => h(NIcon, null, { default: () => h(EyeOutline) }) }),
        default: () => '查看',
      }),
    ]),
  },
]

const allColumns = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '派单号', key: 'orderNo', width: 170 },
  { title: '基站编码', key: 'stationCode', width: 120 },
  {
    title: '基站名称/级别', key: 'station', width: 240,
    render: (r) => h('div', [
      h('div', { style: { fontWeight: 500 } }, r.stationName),
      h('div', { style: { marginTop: '2px' } }, renderLevelTag(r.stationLevel)),
    ]),
  },
  {
    title: '状态', key: 'status', width: 100,
    render: (r) => r.needHighlight
      ? h('div', { style: { display: 'flex', alignItems: 'center', gap: '4px' } }, [
          h(NIcon, { size: 16, style: { color: '#d03050' } }, { default: () => h(AlertCircleOutline) }),
          renderStatusTag(r.status),
        ])
      : renderStatusTag(r.status),
  },
  { title: '发电时长', key: 'totalGenerateDuration', width: 90, render: (r) => `${r.totalGenerateDuration || 0}h` },
  { title: '燃油消耗', key: 'totalFuelConsumption', width: 90, render: (r) => `${r.totalFuelConsumption || 0}L` },
  { title: '维护人员', key: 'maintainer', width: 90 },
  { title: '区域经理', key: 'regionalManager', width: 100 },
  { title: '审核时间', key: 'managerConfirmTime', width: 160, render: (r) => formatTime(r.managerConfirmTime) },
  {
    title: '操作', key: 'action', width: 150, fixed: 'right',
    render: (r) => h('div', { style: { display: 'flex', gap: '6px' } }, [
      h(NTooltip, null, {
        trigger: () => h(NButton, { size: 'small', onClick: () => viewOne(r.id) }, { default: () => h(NIcon, null, { default: () => h(EyeOutline) }) }),
        default: () => '查看',
      }),
      r.status === 'pending' && h(NButton, {
        size: 'small', type: 'primary', onClick: () => openConfirmModal(r),
      }, { default: () => '确认' }),
      r.status !== 'confirmed' && h(NPopconfirm, { onPositiveClick: () => doDelete(r.id) }, {
        trigger: () => h(NButton, { size: 'small', type: 'error' }, { default: () => h(NIcon, null, { default: () => h(TrashOutline) }) }),
        default: () => '删除此记录？',
      }),
    ]),
  },
]

function pendingRowClass(row) {
  return row.needHighlight ? 'core-row' : ''
}

function allRowClass(row) {
  return row.needHighlight ? 'core-row' : ''
}

async function loadPending() {
  loading.value = true
  try {
    const res = await getRecoveryList({ needManagerConfirm: 'true', page: 1, pageSize: 500 })
    pendingList.value = res.list || []
  } finally {
    loading.value = false
  }
}

async function loadData() {
  loading.value = true
  try {
    const res = await getRecoveryList(searchForm)
    allList.value = res.list || []
    pagination.itemCount = res.total
    pagination.page = searchForm.page
    pagination.pageSize = searchForm.pageSize
  } finally {
    loading.value = false
  }
}

async function loadStatistics() {
  stats.value = await getRecoveryStatistics()
}

async function loadGeneratingOrders() {
  const res = await getDispatchOrderList({ page: 1, pageSize: 500 })
  generatingOrders.value = (res.list || [])
    .filter(o => ['arrived', 'generating'].includes(o.status))
    .map(o => ({
      label: `${o.orderNo} - ${o.stationCode} ${o.stationName || ''} ${o.generatorReturned ? '（油机已归还）' : '⚠️ 油机未归还'}`,
      value: o.id,
      disabled: !o.generatorReturned,
    }))
}

function openCreateModal() {
  Object.assign(createForm, {
    orderId: null, powerRestoredTime: Date.now(), generatorStopTime: Date.now(),
    totalFuelConsumption: 0, maintainer: '', photoUrl: '', remark: '',
  })
  createPhotoList.value = []
  loadGeneratingOrders()
  createModalShow.value = true
}

async function handleUploadPhoto({ file, onFinish }) {
  try {
    const res = await uploadImage(file.file)
    if (!createForm.photoUrl) createForm.photoUrl = res.url
    file.url = res.url
    message.success('照片上传成功')
    onFinish()
  } catch (e) {
    onFinish()
  }
}

async function submitCreate() {
  if (!createForm.orderId) return message.warning('请选择派单')
  if (!createForm.maintainer) return message.warning('请输入维护人员')
  try {
    await createRecoveryFromOrder(createForm.orderId, createForm)
    message.success('恢复确认申请已提交，等待区域经理审核')
    createModalShow.value = false
    reloadAll()
  } catch (e) {}
}

async function openConfirmModal(record) {
  currentRecordId.value = record.id
  confirmRecord.value = { ...record }
  Object.assign(confirmForm, { regionalManager: '', managerRemark: '' })
  confirmModalShow.value = true
}

async function doConfirm(isPass) {
  if (!confirmForm.regionalManager) return message.warning('请输入区域经理姓名')
  if (!confirmForm.managerRemark) return message.warning(isPass ? '请输入审核意见' : '请填写驳回原因')
  try {
    await managerConfirmRecovery(currentRecordId.value, {
      confirm: isPass,
      ...confirmForm,
    })
    message.success(isPass ? '✓ 已确认恢复，基站状态更新为已恢复' : '已驳回')
    confirmModalShow.value = false
    reloadAll()
  } catch (e) {}
}

async function viewOne(id) {
  const r = await getRecoveryDetail(id)
  dialog.info({
    title: '恢复确认详情',
    content: h('div', { style: { fontSize: '13px', lineHeight: '1.9' } }, [
      h('div', `派单号：${r.order?.orderNo || '-'}`),
      h('div', `基站：${r.station?.code} - ${r.station?.name}`),
      h('div', `站点级别：${levelOptions.find(l => l.value === r.station?.level)?.label || '-'}`),
      h('div', `状态：${recoveryStatusOptions.find(o => o.value === r.status)?.label || r.status}`),
      h('div', `电力恢复时间：${formatTime(r.powerRestoredTime)}`),
      h('div', `油机停机时间：${formatTime(r.generatorStopTime)}`),
      h('div', `发电时长：${r.totalGenerateDuration || 0} 小时`),
      h('div', `燃油消耗：${r.totalFuelConsumption || 0} L`),
      h('div', `维护人员：${r.maintainer || '-'}（${formatTime(r.maintainerConfirmTime)}）`),
      r.regionalManager && h('div', `区域经理：${r.regionalManager}（${formatTime(r.managerConfirmTime)}）`),
      r.managerRemark && h('div', `审核意见：${r.managerRemark}`),
      r.remark && h('div', `备注：${r.remark}`),
    ]),
  })
}

function doDelete(id) {
  deleteRecovery(id).then(() => { message.success('删除成功'); reloadAll() })
}

function previewImage(url) {
  window.open(url.startsWith('http') ? url : url, '_blank')
}

function reloadAll() {
  loadPending()
  loadData()
  loadStatistics()
}

watch(activeTab, (v) => v === 'pending' ? loadPending() : loadData())

onMounted(() => { loadPending(); loadData(); loadStatistics(); loadGeneratingOrders() })
</script>
