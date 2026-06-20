import request from '../utils/request'

export function getGeneratorList(params) {
  return request({ url: '/generators', method: 'get', params })
}

export function getIdleGenerators() {
  return request({ url: '/generators/idle', method: 'get' })
}

export function getGeneratorDetail(id) {
  return request({ url: `/generators/${id}`, method: 'get' })
}

export function createGenerator(data) {
  return request({ url: '/generators', method: 'post', data })
}

export function updateGenerator(id, data) {
  return request({ url: `/generators/${id}`, method: 'put', data })
}

export function deleteGenerator(id) {
  return request({ url: `/generators/${id}`, method: 'delete' })
}

export function batchDeleteGenerators(ids) {
  return request({ url: '/generators/batch-delete', method: 'post', data: { ids } })
}

export function setGeneratorStatus(id, status) {
  return request({ url: `/generators/${id}/status`, method: 'post', data: { status } })
}

export function getGeneratorStatistics() {
  return request({ url: '/generators/statistics', method: 'get' })
}
