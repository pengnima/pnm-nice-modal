<script setup lang="ts">
import ModalProvide from './ModalProvide.vue'
import { REGISTER_MODAL, dialogMap, show, hide } from './utils/pnm-modal-vue'

defineExpose({
  show,
  hide,
})
</script>

<template>
  <div class="pnm_modal__container">
    <ModalProvide v-for="[key, value] in dialogMap" :key="key" :modalId="key">
      <component :is="key" v-bind="{ ...REGISTER_MODAL[key].props, ...value.props }"> </component>
    </ModalProvide>
  </div>
</template>
