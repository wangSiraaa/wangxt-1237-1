export const levelOptions = [
  { label: '核心站点', value: 'core', type: 'error' },
  { label: '重要站点', value: 'important', type: 'warning' },
  { label: '普通站点', value: 'normal', type: 'default' },
]

export const stationStatusOptions = [
  { label: '正常运行', value: 'normal', type: 'success' },
  { label: '停电中', value: 'power_out', type: 'error' },
  { label: '发电中', value: 'generating', type: 'warning' },
  { label: '已恢复', value: 'restored', type: 'info' },
]

export const generatorStatusOptions = [
  { label: '空闲可用', value: 'idle', type: 'success' },
  { label: '已派发', value: 'dispatched', type: 'info' },
  { label: '使用中', value: 'in_use', type: 'warning' },
  { label: '维修中', value: 'maintenance', type: 'error' },
]

export const orderStatusOptions = [
  { label: '待派发', value: 'pending', type: 'default' },
  { label: '已派发', value: 'assigned', type: 'info' },
  { label: '已到达', value: 'arrived', type: 'warning' },
  { label: '发电中', value: 'generating', type: 'warning' },
  { label: '已完成', value: 'completed', type: 'success' },
  { label: '已取消', value: 'cancelled', type: 'error' },
]

export const fuelStatusOptions = [
  { label: '正常', value: 'normal', type: 'success' },
  { label: '异常', value: 'abnormal', type: 'error' },
  { label: '已说明', value: 'explained', type: 'info' },
]

export const recoveryStatusOptions = [
  { label: '待确认', value: 'pending', type: 'warning' },
  { label: '已确认', value: 'confirmed', type: 'success' },
  { label: '已驳回', value: 'rejected', type: 'error' },
]
