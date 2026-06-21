<template>
  <div class="page-wrapper">
    <div class="page-header">
      <h2 class="page-title">派单与执行管理</h2>
      <n-button type="primary" @click="openCreateModal">
        <template #icon><AddOutline /></template>
        创建派单
      </n-button>
    </div>

    <div class="stat-cards">
      <div class="stat-card">
        <div class="label">派单总数</div>
        <div class="value">{{ stats.total || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">待派发</div>
        <div class="value core">{{ stats.pending || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">发电中</div>
        <div class="value warning">{{ stats.generating || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">油机未归还</div>
        <div class="value warning">{{ stats.notReturned || 0 }}</div>
      </div>
    </div>

    <n-tabs v-model:value="activeTab" type="line" animated>
      <n-tab-pane name="pending" tab="待派单基站（核心未派单高亮）">
        <div class="table-card">
          <n-data-table
            :columns="pendingColumns"
            :data="pendingList"
            :loading="pendingLoading"
            :row-key="(row) => row.stationId"
            :row-class-name="pendingRowClass"
            :pagination="false"
            size="small"
          />
        </div>
      </n-tab-pane>

      <n-tab-pane name="orders" tab="派单列表">
        <div class="toolbar">
          <n-input v-model:value="searchForm.keyword" placeholder="搜索派单号/基站/油机" clearable style="width: 260px;" @keyup.enter="loadOrders">
            <template #prefix><SearchOutline /></template>
          </n-input>
          <n-select v-model:value="searchForm.status" placeholder="派单状态" clearable :options="orderStatusOptions" style="width: 130px;" />
          <div class="spacer"></div>
          <n-button @click="loadOrders"><template #icon><SearchOutline /></template>查询</n-button>
        </div>
        <div class="table-card">
          <n-data-table
            :columns="orderColumns"
            :data="orderList"
            :loading="loading"
            :row-key="(row) => row.id"
            :row-class-name="orderRowClass"
            :pagination="pagination"
            @update:page="(p) => { searchForm.page = p; loadOrders() }"
            @update:page-size="(s) => { searchForm.pageSize = s; loadOrders() }"
          />
        </div>
      </n-tab-pane>
    </n-tabs>

    <n-modal v-model:show="createModalShow" preset="card" style="width: 640px;" title="创建派单">
      <n-alert type="warning" style="margin-bottom: 16px;" v-if="!orderForm.stationId">
        请先选择停电基站进行派单。核心站点请优先处理（红色高亮）。
      </n-alert>
      <n-form :model="orderForm" label-placement="left" label-width="100px">
        <n-form-item label="选择基站" required>
          <n-select
            v-model:value="orderForm.stationId"
            :options="stationOptions"
            filterable
            placeholder="请选择停电基站"
            :render-label="renderStationOption"
          />
        </n-form-item>
        <n-form-item label="选择油机" required>
          <n-select
            v-model:value="orderForm.generatorId"
            :options="generatorOptions"
            filterable
            placeholder="请选择空闲油机"
          />
          <div v-if="orderForm.generatorId" style="margin-top: 4px; font-size: 12px; color: #18a058;">
            ✓ 该油机状态为空闲可用，可正常派发
          </div>
        </n-form-item>
        <n-form-item label="派发人员">
          <n-input v-model:value="orderForm.dispatcher" placeholder="请输入派发人员" />
        </n-form-item>
        <n-form-item label="维护队">
          <n-input v-model:value="orderForm.maintenanceTeam" placeholder="请输入维护队名称" />
        </n-form-item>
        <n-form-item label="队长/领取人">
          <n-input v-model:value="orderForm.teamLeader" placeholder="请输入队长姓名" />
        </n-form-item>
        <n-form-item label="联系电话">
          <n-input v-model:value="orderForm.teamPhone" placeholder="请输入联系电话" />
        </n-form-item>
        <n-form-item label="油桶编码">
          <n-input v-model:value="orderForm.oilBucketCode" placeholder="请输入油桶编码" />
        </n-form-item>
        <n-form-item label="油桶容量(L)">
          <n-input-number v-model:value="orderForm.oilBucketCapacity" :min="0" style="width: 100%;" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="orderForm.remark" type="textarea" placeholder="备注信息" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="createModalShow = false">取消</n-button>
          <n-button type="primary" @click="createOrder">创建并派发</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="assignModalShow" preset="card" style="width: 560px;" title="派发维护队/领取油机">
      <n-form :model="assignForm" label-placement="left" label-width="100px">
        <n-form-item label="维护队">
          <n-input v-model:value="assignForm.maintenanceTeam" placeholder="请输入维护队" />
        </n-form-item>
        <n-form-item label="队长/领取人" required>
          <n-input v-model:value="assignForm.teamLeader" placeholder="请输入领取油机和油桶的人员姓名" />
        </n-form-item>
        <n-form-item label="联系电话" required>
          <n-input v-model:value="assignForm.teamPhone" placeholder="请输入联系电话" />
        </n-form-item>
        <n-form-item label="油桶编码">
          <n-input v-model:value="assignForm.oilBucketCode" placeholder="请输入领取的油桶编码" />
        </n-form-item>
        <n-form-item label="油桶容量(L)">
          <n-input-number v-model:value="assignForm.oilBucketCapacity" :min="0" style="width: 100%;" />
        </n-form-item>
        <n-form-item label="派发人员">
          <n-input v-model:value="assignForm.dispatcher" placeholder="请输入派发人员" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="assignModalShow = false">取消</n-button>
          <n-button type="primary" @click="confirmAssign">确认派发</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="returnModalShow" preset="card" style="width: 480px;" title="归还油机确认">
      <n-alert type="info" style="margin-bottom: 16px;">
        油机归还后将自动变为"空闲可用"状态，可再次进行派发
      </n-alert>
      <n-form :model="returnForm" label-placement="left" label-width="110px">
        <n-form-item label="发电时长(小时)">
          <n-input-number v-model:value="returnForm.totalDuration" :min="0" :step="0.1" style="width: 100%;" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="returnForm.remark" type="textarea" placeholder="归还备注" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="returnModalShow = false">取消</n-button>
          <n-button type="primary" @click="confirmReturn">确认归还</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, h, computed, watch } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { NButton, NTag, NIcon, NTooltip, NPopconfirm, NBadge } from 'naive-ui'
import {
  AddOutline, SearchOutline, PaperPlaneOutline, LocationOutline,
  PlayOutline, ReturnDownForwardOutline, CheckmarkDoneOutline,
  CloseOutline, TrashOutline, AlertCircleOutline,
} from '@vicons/ionicons5'
import {
  getDispatchOrderList, getPendingDispatchList, createDispatchOrder,
  assignDispatchOrder, arriveDispatchOrder, startGenerate,
  returnGenerator, cancelDispatchOrder, deleteDispatchOrder,
  getDispatchOrderStatistics,
} from '../api/dispatch'
import { getIdleGenerators } from '../api/generator'
import { levelOptions, orderStatusOptions } from '../utils/constants'
import dayjs from 'dayjs'

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const pendingLoading = ref(false)
const pendingList = ref([])
const orderList = ref([])
const stats = ref({})
const activeTab = ref('pending')
const idleGenerators = ref([])

const searchForm = reactive({ keyword: '', status: null, page: 1, pageSize: 20 })
const pagination = reactive({ page: 1, pageSize: 20, itemCount: 0, showSizePicker: true, pageSizes: [10, 20, 50, 100] })

const createModalShow = ref(false)
const orderForm = reactive({ stationId: null, generatorId: null, maintenanceTeam: '', teamLeader: '', teamPhone: '', dispatcher: '', oilBucketCode: '', oilBucketCapacity: 0, remark: '' })

const assignModalShow = ref(false)
const currentOrderId = ref(null)
const assignForm = reactive({ maintenanceTeam: '', teamLeader: '', teamPhone: '', oilBucketCode: '', oilBucketCapacity: 0, dispatcher: '' })

const returnModalShow = ref(false)
const returnForm = reactive({ totalDuration: 0, remark: '' })

const stationOptions = computed(() => pendingList.value
  .filter(s => !s.isDispatched)
  .map(s => ({
    label: `${s.stationCode} - ${s.stationName}`,
    value: s.stationId,
    level: s.stationLevel,
    isCore: s.isCore,
  }))
)

const generatorOptions = computed(() => idleGenerators.value.map(g => ({
  label: `${g.code} - ${g.name} (${g.model || '未填写型号'})`,
  value: g.id,
})))

const pendingColumns = [
  { title: '基站编码', key: 'stationCode', width: 130 },
  { title: '基站名称', key: 'stationName', width: 200 },
  {
    title: '站点级别', key: 'stationLevel', width: 100,
    render: (r) => {
      const opt = levelOptions.find(o => o.value === r.stationLevel)
      return h(NBadge, {
        value: r.isCore ? '核心' : null, type: 'error', processing: r.needHighlight,
      }, {
        default: () => h(NTag, { type: opt?.type || 'default', size: 'small' }, { default: () => opt?.label || r.stationLevel }),
      })
    },
  },
  { title: '区域', key: 'region', width: 100 },
  { title: '地址', key: 'address', ellipsis: { tooltip: true } },
  { title: '负责人', key: 'manager', width: 90 },
  { title: '联系电话', key: 'managerPhone', width: 130 },
  {
    title: '派单状态', key: 'isDispatched', width: 110,
    render: (r) => h(NTag, { type: r.isDispatched ? 'success' : 'warning', size: 'small' }, { default: () => r.isDispatched ? '已派单' : '待派单' }),
  },
  {
    title: '操作', key: 'action', width: 110, fixed: 'right',
    render: (r) => h(NButton, {
      size: 'small', type: r.needHighlight ? 'error' : 'primary',
      disabled: r.isDispatched, onClick: () => quickDispatch(r),
    }, { default: () => r.isDispatched ? '已派发' : '立即派单' }),
  },
]

function renderStationOption(option) {
  if (option.isCore) {
    return h('span', { style: { display: 'flex', alignItems: 'center', gap: '8px', color: '#d03050' } }, [
      h(NIcon, null, { default: () => h(AlertCircleOutline) }),
      option.label + ' 【核心站点-优先】',
    ])
  }
  return option.label
}

const orderColumns = [
  { title: '派单号', key: 'orderNo', width: 180 },
  {
    title: '基站信息', key: 'stationInfo', width: 260,
    render: (r) => h('div', [
      h('div', { style: { fontWeight: 500 } }, `${r.stationCode} - ${r.stationName || ''}`),
      h('div', { style: { fontSize: '12px', color: '#8c8c8c' } }, [
        h(NTag, { type: r.stationLevel === 'core' ? 'error' : r.stationLevel === 'important' ? 'warning' : 'default', size: 'small', style: 'margin-right: 6px;' },
          { default: () => levelOptions.find(l => l.value === r.stationLevel)?.label || r.stationLevel }),
      ]),
    ]),
  },
  { title: '油机', key: 'generatorCode', width: 160, render: (r) => (r.generatorCode || '-') + ' ' + (r.generatorName || '') },
  { title: '油桶', key: 'oilBucketCode', width: 100, render: (r) => r.oilBucketCode ? `${r.oilBucketCode} (${r.oilBucketCapacity}L)` : '-' },
  {
    title: '派单状态', key: 'status', width: 100,
    render: (r) => {
      const opt = orderStatusOptions.find(o => o.value === r.status)
      return h(NTag, { type: opt?.type || 'default', size: 'small' }, { default: () => opt?.label || r.status })
    },
  },
  {
    title: '油机归还', key: 'generatorReturned', width: 90,
    render: (r) => {
      if (r.status === 'pending' || r.status === 'cancelled') return '-'
      return h(NTag, { type: r.generatorReturned ? 'success' : 'error', size: 'small' }, { default: () => r.generatorReturned ? '已归还' : '未归还' })
    },
  },
  { title: '维护队/队长', key: 'team', width: 150, render: (r) => (r.maintenanceTeam || '-') + ' / ' + (r.teamLeader || '-') },
  { title: '派发时间', key: 'dispatchTime', width: 160, render: (r) => r.dispatchTime ? dayjs(r.dispatchTime).format('YYYY-MM-DD HH:mm') : '-' },
  {
    title: '操作', key: 'action', width: 280, fixed: 'right',
    render: (r) => h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } }, [
      r.status === 'pending' && h(NTooltip, null, {
        trigger: () => h(NButton, { size: 'small', type: 'primary', onClick: () => openAssignModal(r) }, { default: () => h(NIcon, null, { default: () => h(PaperPlaneOutline) }) }),
        default: () => '派发',
      }),
      (r.status === 'assigned') && h(NTooltip, null, {
        trigger: () => h(NButton, { size: 'small', type: 'info', onClick: () => doArrive(r.id) }, { default: () => h(NIcon, null, { default: () => h(LocationOutline) }) }),
        default: () => '到达现场',
      }),
      r.status === 'arrived' && h(NTooltip, null, {
        trigger: () => h(NButton, { size: 'small', type: 'warning', onClick: () => doStart(r.id) }, { default: () => h(NIcon, null, { default: () => h(PlayOutline) }) }),
        default: () => '开始发电',
      }),
      (r.status === 'assigned' || r.status === 'arrived' || r.status === 'generating') && !r.generatorReturned && h(NTooltip, null, {
        trigger: () => h(NButton, { size: 'small', type: 'success', onClick: () => openReturnModal(r) }, { default: () => h(NIcon, null, { default: () => h(ReturnDownForwardOutline) }) }),
        default: () => '归还油机',
      }),
      (r.status === 'generating') && r.generatorReturned && h(NTooltip, null, {
        trigger: () => h(NButton, { size: 'small', type: 'success', onClick: () => doComplete(r.id) }, { default: () => h(NIcon, null, { default: () => h(CheckmarkDoneOutline) }) }),
        default: () => '完成派单',
      }),
      (r.status === 'pending' || r.status === 'assigned') && h(NPopconfirm, { onPositiveClick: () => doCancel(r.id) }, {
        trigger: () => h(NButton, { size: 'small' }, { default: () => h(NIcon, null, { default: () => h(CloseOutline) }) }),
        default: () => '取消此派单？',
      }),
      (r.status === 'pending' || r.status === 'cancelled') && h(NPopconfirm, { onPositiveClick: () => doDelete(r.id) }, {
        trigger: () => h(NButton, { size: 'small', type: 'error' }, { default: () => h(NIcon, null, { default: () => h(TrashOutline) }) }),
        default: () => '删除派单？',
      }),
    ]),
  },
]

function pendingRowClass(row) {
  return row.needHighlight ? 'core-row' : ''
}

function orderRowClass(row) {
  return row.needHighlight ? 'core-row' : ''
}

async function loadPending() {
  pendingLoading.value = true
  try {
    pendingList.value = await getPendingDispatchList()
  } finally {
    pendingLoading.value = false
  }
}

async function loadOrders() {
  loading.value = true
  try {
    const res = await getDispatchOrderList(searchForm)
    orderList.value = res.list
    pagination.itemCount = res.total
  } finally {
    loading.value = false
  }
}

async function loadStatistics() {
  stats.value = await getDispatchOrderStatistics()
}

async function loadIdleGenerators() {
  idleGenerators.value = await getIdleGenerators()
}

function quickDispatch(station) {
  Object.assign(orderForm, { stationId: station.stationId, generatorId: null, maintenanceTeam: '', teamLeader: '', teamPhone: '', dispatcher: station.manager || '', oilBucketCode: '', oilBucketCapacity: 0, remark: '' })
  loadIdleGenerators()
  createModalShow.value = true
}

function openCreateModal() {
  Object.assign(orderForm, { stationId: null, generatorId: null, maintenanceTeam: '', teamLeader: '', teamPhone: '', dispatcher: '', oilBucketCode: '', oilBucketCapacity: 0, remark: '' })
  loadPending()
  loadIdleGenerators()
  createModalShow.value = true
}

async function createOrder() {
  if (!orderForm.stationId) return message.warning('请选择基站')
  if (!orderForm.generatorId) return message.warning('请选择油机')
  try {
    await createDispatchOrder(orderForm)
    message.success('派单创建成功')
    createModalShow.value = false
    reloadAll()
  } catch (e) {}
}

function openAssignModal(row) {
  currentOrderId.value = row.id
  Object.assign(assignForm, {
    maintenanceTeam: row.maintenanceTeam || '',
    teamLeader: row.teamLeader || '',
    teamPhone: row.teamPhone || '',
    oilBucketCode: row.oilBucketCode || '',
    oilBucketCapacity: row.oilBucketCapacity || 0,
    dispatcher: row.dispatcher || '',
  })
  assignModalShow.value = true
}

async function confirmAssign() {
  if (!assignForm.teamLeader) return message.warning('请输入领取人')
  if (!assignForm.teamPhone) return message.warning('请输入联系电话')
  try {
    await assignDispatchOrder(currentOrderId.value, assignForm)
    message.success('派发成功，维护队已领取油机和油桶')
    assignModalShow.value = false
    reloadAll()
  } catch (e) {}
}

function openReturnModal(row) {
  currentOrderId.value = row.id
  Object.assign(returnForm, { totalDuration: row.totalDuration || 0, remark: '' })
  returnModalShow.value = true
}

async function confirmReturn() {
  try {
    await returnGenerator(currentOrderId.value, returnForm)
    message.success('油机归还确认成功，可再次派发')
    returnModalShow.value = false
    reloadAll()
  } catch (e) {}
}

function doArrive(id) {
  arriveDispatchOrder(id).then(() => { message.success('已确认到达现场'); reloadAll() })
}

function doStart(id) {
  startGenerate(id).then(() => { message.success('开始发电，基站状态更新为发电中'); reloadAll() })
}

function doComplete(id) {
  dialog.warning({
    title: '完成派单',
    content: '确认完成此派单？将进入恢复确认流程。',
    onPositiveClick: () => {
      import('../api/dispatch').then(m => m.completeDispatchOrder(id)).then(() => { message.success('派单已完成'); reloadAll() })
    },
  })
}

function doCancel(id) {
  cancelDispatchOrder(id).then(() => { message.success('派单已取消，油机已释放'); reloadAll() })
}

function doDelete(id) {
  deleteDispatchOrder(id).then(() => { message.success('派单已删除'); reloadAll() })
}

function reloadAll() {
  loadPending()
  loadOrders()
  loadStatistics()
  loadIdleGenerators()
}

watch(activeTab, (v) => {
  if (v === 'pending') loadPending()
  else loadOrders()
})

onMounted(() => { loadPending(); loadOrders(); loadStatistics(); loadIdleGenerators() })
</script>
