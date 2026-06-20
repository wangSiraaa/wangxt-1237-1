import request from '../utils/request'

export function getDispatchOrderList(params) {
  return request({ url: '/dispatch-orders', method: 'get', params })
}

export function getPendingDispatchList() {
  return request({ url: '/dispatch-orders/pending-list', method: 'get' })
}

export function getDispatchOrderDetail(id) {
  return request({ url: `/dispatch-orders/${id}`, method: 'get' })
}

export function createDispatchOrder(data) {
  return request({ url: '/dispatch-orders', method: 'post', data })
}

export function assignDispatchOrder(id, data) {
  return request({ url: `/dispatch-orders/${id}/assign`, method: 'post', data })
}

export function arriveDispatchOrder(id) {
  return request({ url: `/dispatch-orders/${id}/arrive`, method: 'post' })
}

export function startGenerate(id) {
  return request({ url: `/dispatch-orders/${id}/start-generate`, method: 'post' })
}

export function returnGenerator(id, data) {
  return request({ url: `/dispatch-orders/${id}/return-generator`, method: 'post', data })
}

export function completeDispatchOrder(id) {
  return request({ url: `/dispatch-orders/${id}/complete`, method: 'post' })
}

export function cancelDispatchOrder(id) {
  return request({ url: `/dispatch-orders/${id}/cancel`, method: 'post' })
}

export function deleteDispatchOrder(id) {
  return request({ url: `/dispatch-orders/${id}`, method: 'delete' })
}

export function getDispatchOrderStatistics() {
  return request({ url: '/dispatch-orders/statistics', method: 'get' })
}
