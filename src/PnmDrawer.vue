<script lang="ts" setup>
import { useModal } from './utils/pnm-modal-vue'
import { ElDrawer, ElButton, drawerEmits, drawerProps } from 'element-plus'
import { computed, useSlots, defineProps, defineEmits } from 'vue'
const emits = defineEmits({ ...drawerEmits })
const props = defineProps({ ...drawerProps, onOk: Function, onCancel: Function })
const modal = useModal()
const slots = useSlots()

const onOkFunc = () => {
  if (props?.onOk) return props?.onOk?.()

  modal?.resolve()
  modal?.hide()
}

const onCancelFunc = () => {
  if (props?.onCancel) return props?.onCancel?.()

  modal?.reject()
  modal?.hide()
}

// 点击 x 按钮, 点击 mask, 按 ESC 会调用
const onBeforeClose = (done: () => void) => {
  modal?.hide()
  done()
}

const events = computed(() => {
  const keys = Object.keys(drawerEmits)
  return keys.reduce((total: any, current: any) => {
    total[current] = emits.bind(null, current)
    return total
  }, {})
})

const bindProps = computed(() => {
  return { ...props, onOk: undefined, onCancel: undefined }
})
</script>

<template>
  <ElDrawer
    v-bind="{ ...bindProps, beforeClose: bindProps?.beforeClose || onBeforeClose, destroyOnClose: true }"
    v-on="{ ...events }"
  >
    <template v-for="(_, name, i) in slots" :key="i" v-slot:[name]="data">
      <slot :name="name" v-bind="data"></slot>
    </template>

    <template #footer>
      <ElButton @click="onCancelFunc">取消</ElButton>
      <ElButton type="primary" @click="onOkFunc">确定</ElButton>
    </template>
  </ElDrawer>
</template>
