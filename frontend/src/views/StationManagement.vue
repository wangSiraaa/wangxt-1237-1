<template>
  <div class="page-wrapper">
    <div class="page-header">
      <h2 class="page-title">基站管理与停电告警</h2>
      <n-space>
        <n-button @click="openImportModal">
          <template #icon><CloudUploadOutline /></template>
          导入停电基站
        </n-button>
        <n-button type="primary" @click="openStationModal()">
          <template #icon><AddOutline /></template>
          新增基站
        </n-button>
      </n-space>
    </div>

    <div class="stat-cards">
      <div class="stat-card">
        <div class="label">基站总数</div>
        <div class="value">{{ stats.total || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">核心站点</div>
        <div class="value core">{{ stats.byLevel?.core || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">停电基站</div>
        <div class="value warning">{{ stats.powerOut || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">发电中</div>
        <div class="value">{{ stats.generating || 0 }}</div>
      </div>
    </div>

    <div class="toolbar">
      <n-input
        v-model:value="searchForm.keyword"
        placeholder="搜索基站编码/名称/地址"
        clearable
        style="width: 260px;"
        @keyup.enter="loadData"
      >
        <template #prefix><SearchOutline /></template>
      </n-input>
      <n-select
        v-model:value="searchForm.level"
        placeholder="站点级别"
        clearable
        :options="levelOptions"
        style="width: 130px;"
      />
      <n-select
        v-model:value="searchForm.status"
        placeholder="基站状态"
        clearable
        :options="stationStatusOptions"
        style="width: 130px;"
      />
      <n-input
        v-model:value="searchForm.region"
        placeholder="区域"
        clearable
        style="width: 130px;"
      />
      <div class="spacer"></div>
      <n-button @click="loadData">
        <template #icon><SearchOutline /></template>
        查询
      </n-button>
      <n-button :disabled="!selectedRowKeys.length" type="error" @click="batchMarkPowerOut">
        标记为停电
      </n-button>
      <n-button :disabled="!selectedRowKeys.length" type="success" @click="batchRestore">
        恢复正常
      </n-button>
      <n-button :disabled="!selectedRowKeys.length" type="warning" @click="batchDelete">
        <template #icon><TrashOutline /></template>
        批量删除
      </n-button>
    </div>

    <div class="table-card">
      <n-data-table
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :row-key="(row) => row.id"
        v-model:checked-row-keys="selectedRowKeys"
        :row-class-name="rowClassName"
        :pagination="pagination"
        @update:page="(p) => { searchForm.page = p; loadData() }"
        @update:page-size="(s) => { searchForm.pageSize = s; loadData() }"
      />
    </div>

    <n-modal v-model:show="stationModalShow" preset="card" style="width: 600px;" :title="editingId ? '编辑基站' : '新增基站'">
      <n-form :model="stationForm" label-placement="left" label-width="100px">
        <n-form-item label="基站编码" required>
          <n-input v-model:value="stationForm.code" placeholder="请输入基站编码" />
        </n-form-item>
        <n-form-item label="基站名称" required>
          <n-input v-model:value="stationForm.name" placeholder="请输入基站名称" />
        </n-form-item>
        <n-form-item label="站点级别" required>
          <n-select v-model:value="stationForm.level" :options="levelOptions" />
        </n-form-item>
        <n-form-item label="地址">
          <n-input v-model:value="stationForm.address" placeholder="请输入地址" />
        </n-form-item>
        <n-form-item label="区域">
          <n-input v-model:value="stationForm.region" placeholder="请输入所属区域" />
        </n-form-item>
        <n-form-item label="基站状态">
          <n-select v-model:value="stationForm.status" :options="stationStatusOptions" />
        </n-form-item>
        <n-form-item label="负责人">
          <n-input v-model:value="stationForm.manager" placeholder="请输入负责人姓名" />
        </n-form-item>
        <n-form-item label="联系电话">
          <n-input v-model:value="stationForm.managerPhone" placeholder="请输入联系电话" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="stationForm.remark" type="textarea" placeholder="备注信息" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="stationModalShow = false">取消</n-button>
          <n-button type="primary" @click="saveStation">保存</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="importModalShow" preset="card" style="width: 500px;" title="导入停电影响基站">
      <div style="margin-bottom: 16px;">
        <n-alert type="info">
          支持 Excel 格式（.xlsx/.xls），需包含列：基站编码、基站名称（可选）、地址、级别、区域、负责人、联系电话
        </n-alert>
      </div>
      <n-upload
        :max="1"
        accept=".xlsx,.xls"
        :custom-request="handleCustomUpload"
        :show-file-list="false"
      >
        <n-button>
          <template #icon><CloudUploadOutline /></template>
          选择Excel文件
        </n-button>
      </n-upload>
      <div v-if="importResult" style="margin-top: 16px; padding: 12px; background: #f7f8fa; border-radius: 4px;">
        <div>导入结果：</div>
        <div style="margin-top: 8px;">成功：<n-tag type="success" size="small">{{ importResult.success }}</n-tag></div>
        <div style="margin-top: 4px;">失败：<n-tag type="error" size="small">{{ importResult.failed }}</n-tag></div>
      </div>
      <template #footer>
        <n-space justify="end">
          <n-button @click="importModalShow = false">关闭</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, h } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { NButton, NPopconfirm, NTag, NIcon, NTooltip } from 'naive-ui'
import {
  AddOutline, EditOutline, TrashOutline, SearchOutline, CloudUploadOutline,
  FlashOffOutline, CheckmarkDoneOutline, EyeOutline,
} from '@vicons/ionicons5'
import {
  getStationList, createStation, updateStation, deleteStation,
  batchDeleteStations, markStationsPowerOut, restoreStationsNormal,
  importPowerOutStations, getStationStatistics,
} from '../api/station'
import { levelOptions, stationStatusOptions } from '../utils/constants'

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const tableData = ref([])
const selectedRowKeys = ref([])
const stats = ref({})

const searchForm = reactive({
  keyword: '', level: null, status: null, region: '', page: 1, pageSize: 20,
})
const pagination = reactive({ page: 1, pageSize: 20, itemCount: 0, showSizePicker: true, pageSizes: [10, 20, 50, 100] })

const stationModalShow = ref(false)
const editingId = ref(null)
const stationForm = reactive({})
const importModalShow = ref(false)
const importResult = ref(null)

function renderTag(options, value, defaultType = 'default') {
  const opt = options.find(o => o.value === value)
  return h(NTag, { type: opt?.type || defaultType, size: 'small' }, { default: () => opt?.label || value })
}

const columns = [
  { type: 'selection', width: 50 },
  { title: '基站编码', key: 'code', width: 130 },
  { title: '基站名称', key: 'name', width: 180, ellipsis: { tooltip: true } },
  { title: '站点级别', key: 'level', width: 100, render: (r) => renderTag(levelOptions, r.level) },
  { title: '状态', key: 'status', width: 100, render: (r) => renderTag(stationStatusOptions, r.status) },
  { title: '区域', key: 'region', width: 100 },
  { title: '地址', key: 'address', width: 200, ellipsis: { tooltip: true } },
  { title: '负责人', key: 'manager', width: 90 },
  { title: '联系电话', key: 'managerPhone', width: 130 },
  {
    title: '操作', key: 'action', width: 200, fixed: 'right',
    render: (row) => h('div', { style: { display: 'flex', gap: '8px' } }, [
      h(NTooltip, null, {
        trigger: () => h(NButton, { size: 'small', onClick: () => openStationModal(row) }, { default: () => h(NIcon, null, { default: () => h(EditOutline) }) }),
        default: () => '编辑',
      }),
      h(NTooltip, null, {
        trigger: () => h(NButton, { size: 'small', type: 'warning', onClick: () => markOnePowerOut(row) }, { default: () => h(NIcon, null, { default: () => h(FlashOffOutline) }) }),
        default: () => '标记停电',
      }),
      h(NTooltip, null, {
        trigger: () => h(NButton, { size: 'small', type: 'success', onClick: () => restoreOne(row) }, { default: () => h(NIcon, null, { default: () => h(CheckmarkDoneOutline) }) }),
        default: () => '恢复正常',
      }),
      h(NPopconfirm, { onPositiveClick: () => removeOne(row) }, {
        trigger: () => h(NButton, { size: 'small', type: 'error' }, { default: () => h(NIcon, null, { default: () => h(TrashOutline) }) }),
        default: () => '确认删除该基站？',
      }),
    ]),
  },
]

function rowClassName(row) {
  return row.level === 'core' && row.status === 'power_out' ? 'core-row' : ''
}

function resetStationForm() {
  Object.assign(stationForm, { code: '', name: '', level: 'normal', address: '', region: '', status: 'normal', manager: '', managerPhone: '', remark: '' })
}

async function loadData() {
  loading.value = true
  try {
    const res = await getStationList(searchForm)
    tableData.value = res.list
    pagination.itemCount = res.total
    pagination.page = searchForm.page
    pagination.pageSize = searchForm.pageSize
  } finally {
    loading.value = false
  }
}

async function loadStatistics() {
  stats.value = await getStationStatistics()
}

function openStationModal(row = null) {
  resetStationForm()
  editingId.value = null
  if (row) {
    editingId.value = row.id
    Object.assign(stationForm, row)
  }
  stationModalShow.value = true
}

async function saveStation() {
  if (!stationForm.code || !stationForm.name || !stationForm.level) {
    message.warning('请填写必填字段')
    return
  }
  try {
    if (editingId.value) {
      await updateStation(editingId.value, stationForm)
      message.success('编辑成功')
    } else {
      await createStation(stationForm)
      message.success('新增成功')
    }
    stationModalShow.value = false
    loadData()
    loadStatistics()
  } catch (e) {}
}

function openImportModal() {
  importResult.value = null
  importModalShow.value = true
}

async function handleCustomUpload({ file, onFinish }) {
  try {
    const res = await importPowerOutStations(file.file)
    importResult.value = res
    message.success(`导入成功${res.success}条`)
    loadData()
    loadStatistics()
  } finally {
    onFinish()
  }
}

function markOnePowerOut(row) {
  markStationsPowerOut([row.id]).then(() => { message.success('已标记为停电'); loadData(); loadStatistics() })
}

function restoreOne(row) {
  restoreStationsNormal([row.id]).then(() => { message.success('已恢复正常'); loadData(); loadStatistics() })
}

function removeOne(row) {
  deleteStation(row.id).then(() => { message.success('删除成功'); loadData(); loadStatistics() })
}

function batchMarkPowerOut() {
  if (!selectedRowKeys.value.length) return
  dialog.warning({
    title: '确认标记停电',
    content: `将${selectedRowKeys.value.length}个基站标记为停电状态？`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: () => {
      markStationsPowerOut(selectedRowKeys.value).then(() => { message.success('标记成功'); loadData(); loadStatistics(); selectedRowKeys.value = [] })
    },
  })
}

function batchRestore() {
  if (!selectedRowKeys.value.length) return
  restoreStationsNormal(selectedRowKeys.value).then(() => { message.success('恢复成功'); loadData(); loadStatistics(); selectedRowKeys.value = [] })
}

function batchDelete() {
  if (!selectedRowKeys.value.length) return
  dialog.warning({
    title: '确认删除',
    content: `确认删除选中的${selectedRowKeys.value.length}条记录？此操作不可恢复`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => {
      batchDeleteStations(selectedRowKeys.value).then(() => { message.success('删除成功'); loadData(); loadStatistics(); selectedRowKeys.value = [] })
    },
  })
}

onMounted(() => { loadData(); loadStatistics() })
</script>
