<script setup lang="ts">
import { provide, defineProps } from 'vue'
import { injectModalIdKey } from './utils/pnm-modal-vue'
const props = defineProps({
  modalId: String,
})
provide(injectModalIdKey, props.modalId)
</script>

<template>
  <slot></slot>
</template>
