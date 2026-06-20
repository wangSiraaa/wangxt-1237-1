<template>
  <div class="page-wrapper">
    <div class="page-header">
      <h2 class="page-title">燃油消耗与异常管理</h2>
      <n-button type="primary" @click="openAddModal">
        <template #icon><AddOutline /></template>
        录入燃油消耗
      </n-button>
    </div>

    <div class="stat-cards">
      <div class="stat-card">
        <div class="label">记录总数</div>
        <div class="value">{{ stats.totalRecords || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">累计消耗(L)</div>
        <div class="value">{{ stats.totalConsumption || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">平均消耗(L)</div>
        <div class="value">{{ stats.avgConsumption || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">异常未说明</div>
        <div class="value core">{{ stats.abnormalCount || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">需上传照片</div>
        <div class="value warning">{{ stats.needPhotoCount || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">已说明</div>
        <div class="value" style="color:#18a058">{{ stats.explainedCount || 0 }}</div>
      </div>
    </div>

    <div class="toolbar">
      <n-select
        v-model:value="searchForm.abnormalStatus"
        placeholder="异常状态"
        clearable
        :options="fuelStatusOptions"
        style="width: 130px;"
      />
      <n-input
        v-model:value="searchForm.orderNo"
        placeholder="搜索派单号"
        clearable
        style="width: 200px;"
      >
        <template #prefix><SearchOutline /></template>
      </n-input>
      <div class="spacer"></div>
      <n-button @click="loadData">
        <template #icon><SearchOutline /></template>
        查询
      </n-button>
    </div>

    <div class="table-card">
      <n-data-table
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :row-key="(row) => row.id"
        :row-class-name="rowClassName"
        :pagination="pagination"
        @update:page="(p) => { searchForm.page = p; loadData() }"
        @update:page-size="(s) => { searchForm.pageSize = s; loadData() }"
      />
    </div>

    <n-modal v-model:show="addModalShow" preset="card" style="width: 560px;" title="录入燃油消耗">
      <n-alert type="info" style="margin-bottom: 16px;">
        系统将自动与标准消耗（5L/小时）对比，偏差超过30%将标记为异常，要求上传现场照片说明
      </n-alert>
      <n-form :model="addForm" label-placement="left" label-width="110px">
        <n-form-item label="关联派单" required>
          <n-select
            v-model:value="addForm.orderId"
            :options="orderOptions"
            filterable
            placeholder="选择进行中的派单"
          />
        </n-form-item>
        <n-form-item label="初始油量(L)">
          <n-input-number v-model:value="addForm.initialFuel" :min="0" :step="1" style="width: 100%;" />
        </n-form-item>
        <n-form-item label="剩余油量(L)">
          <n-input-number v-model:value="addForm.remainingFuel" :min="0" :step="1" style="width: 100%;" />
        </n-form-item>
        <n-form-item label="实际消耗(L)">
          <n-input-number v-model:value="addForm.consumption" :min="0" :step="0.1" style="width: 100%;" />
          <div v-if="addForm.consumption > 0" style="margin-top: 4px; font-size: 12px;">
            提示：如不填剩余油量，可直接录入实际消耗量；否则 = 初始 - 剩余
          </div>
        </n-form-item>
        <n-form-item label="记录时间">
          <n-date-picker v-model:value="addForm.recordTime" type="datetime" style="width: 100%;" clearable />
        </n-form-item>
        <n-form-item label="记录人">
          <n-input v-model:value="addForm.recorder" placeholder="请输入记录人" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="addForm.remark" type="textarea" placeholder="备注" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="addModalShow = false">取消</n-button>
          <n-button type="primary" @click="submitRecord">保存记录</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="explainModalShow" preset="card" style="width: 560px;" title="燃油消耗异常说明">
      <div class="info-grid" style="margin-bottom: 16px;">
        <div class="info-item"><span class="info-label">派单号</span><span class="info-value">{{ explainOrder.orderNo || '-' }}</span></div>
        <div class="info-item"><span class="info-label">实际消耗</span><span class="info-value core">{{ explainRecord.consumption || 0 }}L</span></div>
        <div class="info-item"><span class="info-label">标准消耗</span><span class="info-value">{{ explainRecord.standardConsumption || 0 }}L</span></div>
        <div class="info-item"><span class="info-label">偏差率</span><span class="info-value warning">{{ deviationText }}</span></div>
      </div>
      <n-alert type="warning" style="margin-bottom: 16px;" v-if="explainRecord.photoRequired">
        燃油消耗异常（偏差超过30%），必须上传现场照片进行说明
      </n-alert>
      <n-form :model="explainForm" label-placement="left" label-width="100px">
        <n-form-item label="异常说明" required>
          <n-input
            v-model:value="explainForm.explanation"
            type="textarea"
            :rows="4"
            placeholder="请详细说明燃油消耗异常的原因（如现场温度低、负载高等）"
          />
        </n-form-item>
        <n-form-item label="现场照片" :required="explainRecord.photoRequired">
          <div>
            <n-upload
              :max="5"
              list-type="image-card"
              accept="image/*"
              :custom-request="handleUploadPhoto"
              v-model:file-list="photoFileList"
            />
            <div v-if="explainRecord.photoUrl && !photoFileList.length" style="margin-top: 8px;">
              已有照片：
              <img
                :src="explainRecord.photoUrl.startsWith('http') ? explainRecord.photoUrl : `${location.origin}/${explainRecord.photoUrl.replace(/^\//, '')}`"
                class="photo-preview"
                @click="previewImage(explainRecord.photoUrl)"
              />
            </div>
          </div>
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="explainModalShow = false">取消</n-button>
          <n-button type="primary" @click="submitExplain">提交说明</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-image-group ref="imageGroupRef">
      <n-image
        v-for="(img, idx) in previewImages"
        :key="idx"
        :src="img.src"
        style="display: none;"
        :preview-disabled="!img.previewable"
      />
    </n-image-group>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, h } from 'vue'
import { useMessage, useDialog, useImageGroup } from 'naive-ui'
import { NButton, NTag, NIcon, NTooltip, NPopconfirm, NAvatar, NBadge } from 'naive-ui'
import {
  AddOutline, SearchOutline, AlertCircleOutline, TrashOutline, CameraOutline,
  CheckmarkCircleOutline, EyeOutline,
} from '@vicons/ionicons5'
import {
  getFuelRecordList, createFuelRecord, explainFuelAbnormal, deleteFuelRecord,
  getFuelStatistics, getFuelRecordsByOrder,
} from '../api/fuel'
import { getDispatchOrderList } from '../api/dispatch'
import { uploadImage } from '../api/upload'
import { fuelStatusOptions, orderStatusOptions } from '../utils/constants'
import dayjs from 'dayjs'

const message = useMessage()
const dialog = useDialog()
const imageGroupRef = ref(null)
const loading = ref(false)
const tableData = ref([])
const stats = ref({})
const activeOrders = ref([])
const previewImages = ref([])
const photoFileList = ref([])

const searchForm = reactive({ abnormalStatus: null, orderNo: '', page: 1, pageSize: 20 })
const pagination = reactive({ page: 1, pageSize: 20, itemCount: 0, showSizePicker: true, pageSizes: [10, 20, 50, 100] })

const addModalShow = ref(false)
const addForm = reactive({ orderId: null, initialFuel: 0, remainingFuel: 0, consumption: 0, recordTime: null, recorder: '', remark: '' })

const explainModalShow = ref(false)
const currentRecordId = ref(null)
const explainRecord = ref({})
const explainOrder = ref({})
const explainForm = reactive({ explanation: '', photoUrl: '' })

const orderOptions = computed(() => activeOrders.value.map(o => ({
  label: `${o.orderNo} - ${o.stationCode || ''} ${o.stationName || ''} (${o.status})`,
  value: o.id,
})))

const deviationText = computed(() => {
  if (!explainRecord.value.consumption || !explainRecord.value.standardConsumption) return '-'
  const dev = Math.abs(explainRecord.value.consumption - explainRecord.value.standardConsumption) / explainRecord.value.standardConsumption * 100
  return `${dev.toFixed(1)}%`
})

const columns = [
  { title: '记录ID', key: 'id', width: 80 },
  {
    title: '派单信息', key: 'orderInfo', width: 260,
    render: (r) => {
      const order = r.order || {}
      return h('div', [
        h('div', { style: { fontWeight: 500 } }, order.orderNo || '-'),
        h('div', { style: { fontSize: '12px', color: '#8c8c8c' } }, order.station?.code || ''),
      ])
    },
  },
  { title: '初始油量(L)', key: 'initialFuel', width: 100 },
  { title: '剩余油量(L)', key: 'remainingFuel', width: 100 },
  {
    title: '实际消耗(L)', key: 'consumption', width: 110,
    render: (r) => h('span', { style: { color: r.abnormalStatus !== 'normal' ? '#d03050' : '#1f1f1f', fontWeight: 500 } }, r.consumption),
  },
  {
    title: '标准消耗(L)', key: 'standardConsumption', width: 110,
    render: (r) => h('span', { style: { color: '#8c8c8c' } }, r.standardConsumption),
  },
  {
    title: '偏差', key: 'deviation', width: 90,
    render: (r) => {
      if (!r.standardConsumption) return '-'
      const dev = Math.abs(r.consumption - r.standardConsumption) / r.standardConsumption * 100
      return h(NBadge, {
        value: dev > 30 ? '异常' : null,
        type: dev > 30 ? 'error' : 'success',
        processing: r.abnormalStatus === 'abnormal',
      }, {
        default: () => h(NTag, {
          type: dev > 30 ? 'error' : dev > 10 ? 'warning' : 'success', size: 'small',
        }, { default: () => `${dev.toFixed(1)}%` }),
      })
    },
  },
  {
    title: '异常状态', key: 'abnormalStatus', width: 110,
    render: (r) => {
      const opt = fuelStatusOptions.find(o => o.value === r.abnormalStatus)
      return h(NTag, { type: opt?.type || 'default', size: 'small' }, { default: () => opt?.label || r.abnormalStatus })
    },
  },
  {
    title: '照片', key: 'photoUrl', width: 90,
    render: (r) => {
      if (r.photoRequired && !r.photoUrl) {
        return h(NTag, { type: 'error', size: 'small' }, { default: () => '需上传' })
      }
      if (r.photoUrl) {
        return h('img', {
          class: 'photo-preview',
          src: r.photoUrl.startsWith('http') ? r.photoUrl : r.photoUrl,
          onClick: () => previewImage(r.photoUrl),
        })
      }
      return '-'
    },
  },
  { title: '记录时间', key: 'recordTime', width: 160, render: (r) => r.recordTime ? dayjs(r.recordTime).format('YYYY-MM-DD HH:mm') : '-' },
  { title: '记录人', key: 'recorder', width: 90 },
  {
    title: '操作', key: 'action', width: 180, fixed: 'right',
    render: (r) => h('div', { style: { display: 'flex', gap: '6px' } }, [
      r.abnormalStatus === 'abnormal' && h(NTooltip, null, {
        trigger: () => h(NButton, { size: 'small', type: 'warning', onClick: () => openExplainModal(r) }, { default: () => h(NIcon, null, { default: () => h(AlertCircleOutline) }) }),
        default: () => '异常说明',
      }),
      h(NTooltip, null, {
        trigger: () => h(NButton, { size: 'small', onClick: () => viewDetail(r) }, { default: () => h(NIcon, null, { default: () => h(EyeOutline) }) }),
        default: () => '查看',
      }),
      h(NPopconfirm, { onPositiveClick: () => removeOne(r) }, {
        trigger: () => h(NButton, { size: 'small', type: 'error' }, { default: () => h(NIcon, null, { default: () => h(TrashOutline) }) }),
        default: () => '删除此记录？',
      }),
    ]),
  },
]

function rowClassName(row) {
  return row.abnormalStatus === 'abnormal' && row.photoRequired ? 'core-row' : ''
}

async function loadData() {
  loading.value = true
  try {
    const params = { ...searchForm }
    const res = await getFuelRecordList(params)
    tableData.value = res.list
    pagination.itemCount = res.total
  } finally {
    loading.value = false
  }
}

async function loadStatistics() {
  stats.value = await getFuelStatistics()
}

async function loadActiveOrders() {
  const res = await getDispatchOrderList({ page: 1, pageSize: 200 })
  activeOrders.value = (res.list || []).filter(o => ['assigned', 'arrived', 'generating'].includes(o.status))
}

function openAddModal() {
  Object.assign(addForm, { orderId: null, initialFuel: 0, remainingFuel: 0, consumption: 0, recordTime: Date.now(), recorder: '', remark: '' })
  loadActiveOrders()
  addModalShow.value = true
}

async function submitRecord() {
  if (!addForm.orderId) return message.warning('请选择派单')
  try {
    await createFuelRecord(addForm)
    message.success('燃油记录已保存，系统自动检测异常')
    addModalShow.value = false
    loadData()
    loadStatistics()
  } catch (e) {}
}

async function openExplainModal(record) {
  currentRecordId.value = record.id
  explainRecord.value = { ...record }
  explainOrder.value = record.order || {}
  Object.assign(explainForm, { explanation: '', photoUrl: record.photoUrl || '' })
  photoFileList.value = []
  explainModalShow.value = true
}

async function handleUploadPhoto({ file, onFinish, onError }) {
  try {
    const res = await uploadImage(file.file)
    if (!explainForm.photoUrl) explainForm.photoUrl = res.url
    file.url = res.url
    message.success('照片上传成功')
    onFinish()
  } catch (e) {
    onError()
  }
}

async function submitExplain() {
  if (!explainForm.explanation || !explainForm.explanation.trim()) return message.warning('请填写异常说明')
  if (explainRecord.value.photoRequired && !explainForm.photoUrl && !photoFileList.length) {
    return message.warning('请上传现场照片')
  }
  try {
    await explainFuelAbnormal(currentRecordId.value, explainForm)
    message.success('异常说明已提交')
    explainModalShow.value = false
    loadData()
    loadStatistics()
  } catch (e) {}
}

function previewImage(url) {
  const fullUrl = url.startsWith('http') ? url : url
  previewImages.value = [{ src: fullUrl, previewable: true }]
  setTimeout(() => {
    const imgs = document.querySelectorAll('.n-image-group img')
    if (imgs[0]) imgs[0].click()
  }, 100)
}

function viewDetail(r) {
  dialog.info({
    title: '燃油记录详情',
    content: h('div', { style: { fontSize: '13px', lineHeight: '1.8' } }, [
      h('div', `派单号：${r.order?.orderNo || '-'}`),
      h('div', `初始油量：${r.initialFuel}L`),
      h('div', `剩余油量：${r.remainingFuel}L`),
      h('div', { style: { color: '#d03050' } }, `实际消耗：${r.consumption}L`),
      h('div', `标准消耗：${r.standardConsumption}L`),
      h('div', `状态：${fuelStatusOptions.find(o => o.value === r.abnormalStatus)?.label || '-'}${r.photoRequired ? '（需照片）' : ''}`),
      h('div', `记录人：${r.recorder || '-'}`),
      r.explanation && h('div', `异常说明：${r.explanation}`),
      r.remark && h('div', `备注：${r.remark}`),
    ]),
  })
}

function removeOne(r) {
  deleteFuelRecord(r.id).then(() => { message.success('删除成功'); loadData(); loadStatistics() })
}

onMounted(() => { loadData(); loadStatistics(); loadActiveOrders() })
</script>
