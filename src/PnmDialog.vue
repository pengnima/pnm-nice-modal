<script lang="ts" setup>
import { useModal } from './utils/pnm-modal-vue'
import { ElDialog, ElButton, dialogEmits, dialogProps } from 'element-plus'
import { computed, useSlots, defineProps, defineEmits } from 'vue'
const emits = defineEmits({ ...dialogEmits })
const props = defineProps({ ...dialogProps, onOk: Function, onCancel: Function })
const modal = useModal()
const slots: Record<string, any> = useSlots()

const onOkFunc = () => {
  // 由于无法知道父组件是否定义了 emits 的事件，所以可以用下面这2种方法
  // 1. 用 attrs ，能知道父组件是否传递，但会没有类型提示
  // 2. 用 props ，有类型提示且能知道父组件是否传递了该属性
  // if (attrs.onOk) return attrs?.onOk?.()
  if (props?.onOk) return props?.onOk?.()

  modal?.resolve()
  modal?.hide()
}

const onCancelFunc = () => {
  // if (attrs.onCancel) return attrs?.onCancel?.()
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
  const keys = Object.keys(dialogEmits)
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
  <ElDialog
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
  </ElDialog>
</template>
