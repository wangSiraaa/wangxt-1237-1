import request from '../utils/request'

export function getStationList(params) {
  return request({ url: '/base-stations', method: 'get', params })
}

export function getStationDetail(id) {
  return request({ url: `/base-stations/${id}`, method: 'get' })
}

export function createStation(data) {
  return request({ url: '/base-stations', method: 'post', data })
}

export function updateStation(id, data) {
  return request({ url: `/base-stations/${id}`, method: 'put', data })
}

export function deleteStation(id) {
  return request({ url: `/base-stations/${id}`, method: 'delete' })
}

export function batchDeleteStations(ids) {
  return request({ url: '/base-stations/batch-delete', method: 'post', data: { ids } })
}

export function markStationsPowerOut(ids, powerOutTime) {
  return request({ url: '/base-stations/mark-power-out', method: 'post', data: { ids, powerOutTime } })
}

export function restoreStationsNormal(ids) {
  return request({ url: '/base-stations/restore-normal', method: 'post', data: { ids } })
}

export function importPowerOutStations(file, onProgress) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/base-stations/import-power-out',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  })
}

export function getStationStatistics() {
  return request({ url: '/base-stations/statistics', method: 'get' })
}
