import request from '../utils/request'

export function uploadImage(file, onProgress) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/uploads/image',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  })
}
