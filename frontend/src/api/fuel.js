import request from '../utils/request'

export function getFuelRecordList(params) {
  return request({ url: '/fuel-records', method: 'get', params })
}

export function getFuelRecordsByOrder(orderId) {
  return request({ url: `/fuel-records/order/${orderId}`, method: 'get' })
}

export function getFuelRecordDetail(id) {
  return request({ url: `/fuel-records/${id}`, method: 'get' })
}

export function createFuelRecord(data) {
  return request({ url: '/fuel-records', method: 'post', data })
}

export function explainFuelAbnormal(id, data) {
  return request({ url: `/fuel-records/${id}/explain`, method: 'post', data })
}

export function deleteFuelRecord(id) {
  return request({ url: `/fuel-records/${id}`, method: 'delete' })
}

export function getFuelStatistics() {
  return request({ url: '/fuel-records/statistics', method: 'get' })
}
