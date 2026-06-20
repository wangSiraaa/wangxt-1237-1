<template>
  <n-config-provider :theme="null" :locale="zhCN" :date-locale="dateZhCN">
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <n-loading-bar-provider>
            <n-date-provider>
              <MainLayout />
            </n-date-provider>
          </n-loading-bar-provider>
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import { onMounted, provide, h } from 'vue'
import { useMessage, useDialog, useNotification, useLoadingBar } from 'naive-ui'
import { zhCN, dateZhCN } from 'naive-ui'
import MainLayout from './layout/MainLayout.vue'

onMounted(() => {
  const message = useMessage()
  const dialog = useDialog()
  const notification = useNotification()
  const loadingBar = useLoadingBar()

  window.__messageSuccess = (msg) => message.success(msg)
  window.__messageError = (msg) => message.error(msg)
  window.__messageWarning = (msg) => message.warning(msg)
  window.__messageInfo = (msg) => message.info(msg)

  provide('message', message)
  provide('dialog', dialog)
  provide('notification', notification)
  provide('loadingBar', loadingBar)
})
</script>
