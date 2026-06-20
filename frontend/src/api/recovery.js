import request from '../utils/request'

export function getRecoveryList(params) {
  return request({ url: '/recovery-confirmations', method: 'get', params })
}

export function getRecoveryDetail(id) {
  return request({ url: `/recovery-confirmations/${id}`, method: 'get' })
}

export function getRecoveryByOrder(orderId) {
  return request({ url: `/recovery-confirmations/order/${orderId}`, method: 'get' })
}

export function createRecoveryFromOrder(orderId, data) {
  return request({ url: `/recovery-confirmations/from-order/${orderId}`, method: 'post', data })
}

export function managerConfirmRecovery(id, data) {
  return request({ url: `/recovery-confirmations/${id}/manager-confirm`, method: 'post', data })
}

export function deleteRecovery(id) {
  return request({ url: `/recovery-confirmations/${id}`, method: 'delete' })
}

export function getRecoveryStatistics() {
  return request({ url: '/recovery-confirmations/statistics', method: 'get' })
}
