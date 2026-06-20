<template>
  <div class="page-wrapper">
    <div class="page-header">
      <h2 class="page-title">油机与油桶管理</h2>
      <n-button type="primary" @click="openGeneratorModal()">
        <template #icon><AddOutline /></template>
        新增油机
      </n-button>
    </div>

    <div class="stat-cards">
      <div class="stat-card">
        <div class="label">油机总数</div>
        <div class="value">{{ stats.total || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">空闲可用</div>
        <div class="value" :class="{ core: stats.idle === 0 }">{{ stats.idle || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">已派发/使用中</div>
        <div class="value warning">{{ (stats.dispatched || 0) + (stats.inUse || 0) }}</div>
      </div>
      <div class="stat-card">
        <div class="label">维修中</div>
        <div class="value">{{ stats.maintenance || 0 }}</div>
      </div>
    </div>

    <div class="toolbar">
      <n-input
        v-model:value="searchForm.keyword"
        placeholder="搜索油机编码/名称/型号"
        clearable
        style="width: 260px;"
        @keyup.enter="loadData"
      >
        <template #prefix><SearchOutline /></template>
      </n-input>
      <n-select
        v-model:value="searchForm.status"
        placeholder="油机状态"
        clearable
        :options="generatorStatusOptions"
        style="width: 140px;"
      />
      <n-input
        v-model:value="searchForm.location"
        placeholder="存放位置"
        clearable
        style="width: 150px;"
      />
      <div class="spacer"></div>
      <n-button @click="loadData">
        <template #icon><SearchOutline /></template>
        查询
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
        :pagination="pagination"
        @update:page="(p) => { searchForm.page = p; loadData() }"
        @update:page-size="(s) => { searchForm.pageSize = s; loadData() }"
      />
    </div>

    <n-modal v-model:show="generatorModalShow" preset="card" style="width: 560px;" :title="editingId ? '编辑油机' : '新增油机'">
      <n-form :model="generatorForm" label-placement="left" label-width="100px">
        <n-form-item label="油机编码" required>
          <n-input v-model:value="generatorForm.code" placeholder="请输入油机编码（唯一）" />
        </n-form-item>
        <n-form-item label="油机名称" required>
          <n-input v-model:value="generatorForm.name" placeholder="请输入油机名称" />
        </n-form-item>
        <n-form-item label="型号规格">
          <n-input v-model:value="generatorForm.model" placeholder="请输入型号" />
        </n-form-item>
        <n-form-item label="额定功率(KW)">
          <n-input-number v-model:value="generatorForm.power" :min="0" style="width: 100%;" />
        </n-form-item>
        <n-form-item label="初始油量(L)">
          <n-input-number v-model:value="generatorForm.initialFuel" :min="0" style="width: 100%;" />
        </n-form-item>
        <n-form-item label="当前状态" required>
          <n-select v-model:value="generatorForm.status" :options="generatorStatusOptions" />
        </n-form-item>
        <n-form-item label="存放位置" required>
          <n-input v-model:value="generatorForm.location" placeholder="请输入存放位置" />
        </n-form-item>
        <n-form-item label="保管人">
          <n-input v-model:value="generatorForm.keeper" placeholder="请输入保管人" />
        </n-form-item>
        <n-form-item label="联系电话">
          <n-input v-model:value="generatorForm.keeperPhone" placeholder="请输入联系电话" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="generatorForm.remark" type="textarea" placeholder="备注" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="generatorModalShow = false">取消</n-button>
          <n-button type="primary" @click="saveGenerator">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, h } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { NButton, NPopconfirm, NTag, NIcon, NTooltip } from 'naive-ui'
import { AddOutline, EditOutline, TrashOutline, SearchOutline, ConstructOutline } from '@vicons/ionicons5'
import {
  getGeneratorList, createGenerator, updateGenerator, deleteGenerator,
  batchDeleteGenerators, getGeneratorStatistics,
} from '../api/generator'
import { generatorStatusOptions } from '../utils/constants'

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const tableData = ref([])
const selectedRowKeys = ref([])
const stats = ref({})

const searchForm = reactive({ keyword: '', status: null, location: '', page: 1, pageSize: 20 })
const pagination = reactive({ page: 1, pageSize: 20, itemCount: 0, showSizePicker: true, pageSizes: [10, 20, 50, 100] })

const generatorModalShow = ref(false)
const editingId = ref(null)
const generatorForm = reactive({})

const columns = [
  { type: 'selection', width: 50 },
  { title: '油机编码', key: 'code', width: 130 },
  { title: '油机名称', key: 'name', width: 150 },
  { title: '型号', key: 'model', width: 120 },
  { title: '功率(KW)', key: 'power', width: 100 },
  { title: '初始油量(L)', key: 'initialFuel', width: 110 },
  {
    title: '状态', key: 'status', width: 110,
    render: (r) => {
      const opt = generatorStatusOptions.find(o => o.value === r.status)
      return h(NTag, { type: opt?.type || 'default', size: 'small' }, { default: () => opt?.label || r.status })
    },
  },
  { title: '存放位置', key: 'location', width: 140 },
  { title: '保管人', key: 'keeper', width: 90 },
  { title: '联系电话', key: 'keeperPhone', width: 130 },
  {
    title: '操作', key: 'action', width: 150, fixed: 'right',
    render: (row) => h('div', { style: { display: 'flex', gap: '8px' } }, [
      h(NTooltip, null, {
        trigger: () => h(NButton, { size: 'small', onClick: () => openGeneratorModal(row) }, { default: () => h(NIcon, null, { default: () => h(EditOutline) }) }),
        default: () => '编辑',
      }),
      h(NTooltip, null, {
        trigger: () => h(NButton, { size: 'small', type: 'warning', onClick: () => setMaintenance(row) }, { default: () => h(NIcon, null, { default: () => h(ConstructOutline) }) }),
        default: () => '标记维修',
      }),
      h(NPopconfirm, { onPositiveClick: () => removeOne(row) }, {
        trigger: () => h(NButton, { size: 'small', type: 'error' }, { default: () => h(NIcon, null, { default: () => h(TrashOutline) }) }),
        default: () => '确认删除？',
      }),
    ]),
  },
]

function resetForm() {
  Object.assign(generatorForm, { code: '', name: '', model: '', power: 0, initialFuel: 0, status: 'idle', location: '', keeper: '', keeperPhone: '', remark: '' })
}

async function loadData() {
  loading.value = true
  try {
    const res = await getGeneratorList(searchForm)
    tableData.value = res.list
    pagination.itemCount = res.total
  } finally {
    loading.value = false
  }
}

async function loadStatistics() {
  stats.value = await getGeneratorStatistics()
}

function openGeneratorModal(row = null) {
  resetForm()
  editingId.value = null
  if (row) {
    editingId.value = row.id
    Object.assign(generatorForm, row)
  }
  generatorModalShow.value = true
}

async function saveGenerator() {
  if (!generatorForm.code || !generatorForm.name || !generatorForm.location || !generatorForm.status) {
    message.warning('请填写必填字段')
    return
  }
  try {
    if (editingId.value) {
      await updateGenerator(editingId.value, generatorForm)
      message.success('编辑成功')
    } else {
      await createGenerator(generatorForm)
      message.success('新增成功')
    }
    generatorModalShow.value = false
    loadData()
    loadStatistics()
  } catch (e) {}
}

function setMaintenance(row) {
  dialog.warning({
    title: '标记维修',
    content: `确认将油机"${row.name}"标记为维修中？`,
    onPositiveClick: () => {
      updateGenerator(row.id, { status: 'maintenance' }).then(() => { message.success('已标记维修中'); loadData(); loadStatistics() })
    },
  })
}

function removeOne(row) {
  deleteGenerator(row.id).then(() => { message.success('删除成功'); loadData(); loadStatistics() })
}

function batchDelete() {
  if (!selectedRowKeys.value.length) return
  dialog.warning({
    title: '确认删除',
    content: `确认删除选中的${selectedRowKeys.value.length}条记录？`,
    onPositiveClick: () => {
      batchDeleteGenerators(selectedRowKeys.value).then(() => { message.success('删除成功'); loadData(); loadStatistics(); selectedRowKeys.value = [] })
    },
  })
}

onMounted(() => { loadData(); loadStatistics() })
</script>
