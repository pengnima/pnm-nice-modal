---
title: Vue-Nice-Modal
---

### 前言

承接上篇 [NiceModal 源码分析](https://juejin.cn/post/7170667418795114533)

既然 `React` 都有这么好用的，那我大 `Vue` 怎么能缺席，去 `Github` 上搜索了一圈,没有找到合适的，那就自己操刀写一个~

项目使用 `Vite 3.x` 搭建， `Ts + Vue` 项目

### 对比

和普通弹窗对比就不提了，在 **NieceModal 源码分析** 那一篇就有说明，现在就是和 `ElMessageBox` 进行比较，因为这两个功能非常类似，都有 `Promise`，且都可以`命令式调用`，但最终还是决定自己封装。。因为 `ElMessageBox` 并不能很好处理复杂的弹窗业务，他的内部需要去写 `VNode` ，写起来太难受了。[ElMessageBox](https://element-plus.gitee.io/zh-CN/component/message-box.html#%E4%BD%BF%E7%94%A8-vnode)

```ts
// MyModal.vue
import { defineComponent, h } from 'vue'
import { ElButton } from 'element-plus'
import { ref } from 'vue'

export default defineComponent({
  setup() {
    const count = ref(1)
    const onClick = () => {
      count.value += 1
    }
    return () => h('div', null, [`这是Count: ${count.value}`, h(ElButton, { onClick }, { default: () => '增加' })])
  },
})

// ElMessageBox 方式调用， MyModal 组件需要返回一个 VNode
// 当然我有试过可以使用 MyModal.template， 但这样又丢失了 count.value 这些数据，导致报错
ElMessageBox({
  title: 'ElMessageBox',
  showCancelButton: true,
  message: MyModal.setup?.({}, {} as any) as any,
}).then(() => {
  console.log('...')
})
```

而使用 `NiceModal` 就没有这种限制，你可以写 `SFC` 也可以写`普通组件`，且它不仅可以用在弹窗上，也可以使用抽屉(`ElDrawer`)上

### 优势总结

1. 使用了 Promise

2. 内部处理灵活，对组件实现没有要求

3. 有显/隐要求的都可以使用，不局限于弹窗，抽屉也可以

### 代码实现

先明确下，最终要实现的效果，大部分都是跟 `NiceModalReact` 类似，先创建一个弹窗的占位组件，然后注册(`register`)组件，最后在占位组件中遍历注册的组件，使用的时候调用 `$modal.show('id')` 即可。

#### 1. PnmModal 创建弹窗占位组件

在 `React` 中，我们是使用了 `context` 的数据，去遍历他。那在 `Vue` 里我们可以使用内置组件 `<component is="">`

```vue
<!-- ModalProvide组件，REGISTER_MODAL 和 dialogMap 可以先不管，后面会提到 -->
<template>
  <div class="pnm_modal__container">
    <ModalProvide v-for="[key, value] in dialogMap" :key="key" :modalId="key">
      <component :is="key" v-bind="{ ...REGISTER_MODAL[key].props, ...value.props }"> </component>
    </ModalProvide>
  </div>
</template>
```

我们先不去管 `dialogMap` 和 `props` 的具体实现，只要把这里当作弹窗的占位组件就行。

> 这里可能有朋友问为什么不用 List 遍历，而用 Map， 因为我们后面肯定要使用去改变 dialog 里的属性(比如：开启/隐藏) ，如果用 List 那么查找的效率就不高了， 用 Map 根据 id -> value 的形式，性能相对更好

#### 2. Install 加载插件

上面的组件写完了，然后接下来需要选择全局包装组件的方式，可以使用类似 `React` 的方式写一个 `Provide` 组件去包装 `App`，但在 `Vue` 里还是使用 `vue.use` 的方式去处理会更 `Vue` 些

```ts
// main.ts
import { pnmModalVue } from '@pnm/pnm-modal'
const app = createApp(App)
app.use(pnmModalVue)
app.mount('#app')
```

```ts
// Vue里定义了说： 当调用 app.use(插件) 时，会去调用该插件内部的 install 方法
// 所以，我们在这里声明该方法然后导出即可。

// pnm-modal-vue.ts 文件
import PnmModalVue from '../PnmModal.vue' // 导入该组件，具体实现后面再看
// InjectionKey 这个很重要，给你的 provide/inject 注入类型用的，详情可以看 vue 文档
export const injectModalKey = Symbol() as InjectionKey<InstanceType<typeof PnmModalVue>>

/**
 * 被 vue 装载为插件，需要提供 install 方法
 *
 * @param app vue的应用实例
 * @param options 可选属性
 */
const install = (app: App<Element>, options?: any) => {
  // 1. 创建一个组件app实例
  pnmModalApp = createApp(PnmModalVue) // 注： 这里的 PnmModalVue 是 Vue 组件

  // 2. 将其挂载，并追加到真实节点上
  const pnmModalMount = pnmModalApp.mount(document.createElement('div'))
  document.body.appendChild(pnmModalMount.$el)

  // 3. 处理 options。 我这里是用了注册
  for (const key in options) {
    pnmModalApp.component(key, options[key])
    register(key, options[key])
  }

  // 4. 将 $modal 抛出， 可以用全局，或者使用 provide
  // app.config.globalProperties.$modal = pnmModalMount
  app.provide(injectModalKey, pnmModalMount as any)
}

const obj = {
  install,
}

export default obj
```

#### 3. Register 注册组件

注册组件，用户可以调用 `register(唯一标识符, 组件, 属性)` 去关联 `id` 和 `组件`

```ts
const dialogMap = reactive<Map<string, { id: string; props: any }>>(new Map([]))

const register = (id: string, comp: DefineComponent<any, any, any>, props?: Partial<DialogProps>) => {
  // 注册信息： 存放id 和 props
  REGISTER_MODAL[id] = { id, props }

  // pnmModalApp 就是 PnmModal.vue 的实例，我们给该父组件添加上我们关联的子组件
  // 然后就可以通过 <component :is="id"></component> 去生产我们的子组件
  pnmModalApp.component(id, comp)

  // 这里做初始化，是为了让弹窗的 onOpen 事件能正常响应
  // 如果没有这方面的需求，也可以不设置这个
  _init(id, props)
}

const _init = (id: string, props?: Partial<DialogProps>) => {
  dialogMap.set(id, {
    id,
    props,
  })

  createModal(id)
}
```

这时候，我们的 `PnmModal.vue` 里已经有了我们注册的 `component` ，当用户调用 `dialogMap.set` 的时候，会触发 `Vue` 的更新，然后会在 **占位组件** 那里循环遍历

接下来处理 `Props` 。这里总共设想了 **3 处 props** 的地方，在 `<component>` 处使用 `v-bind="{ ...REGISTER_MODAL[key].props, ...value.props }" 绑定`

1. 用户写的弹窗组件本身附带的 `props`

2. 用户注册的组件时候给予 `register` 方法的 `props`， 被存储在 `REGISTER_MODAL`

3. 用户调用 `$modal.show('id', { ...props })` 时给予的 `props`，被存储在 `dialogMap`

优先级依次递增，`show` 给予的优先级最高，会覆盖之前的同名 `props`

#### 4. Promise 处理方法

这里不复杂，直接上源码，可以参考 `NiceModalReact` 的，但我没有实现特别多功能，因为结合业务需要，我就只弄了这些。 其中 `show` 和 `hide` 需要暴露到外部给 `$modal` 使用

```ts
export const show = (id: string, props?: Partial<DialogProps>): Promise<any> => {
  dialogMap.set(id, {
    id,
    props: {
      ...props,
      'model-value': true,
    },
  })

  // 创建 promise
  if (!modalCallbacks[id]) {
    let theResolve: any, theReject: any

    // 这里的赋值操作，结合 _resolve 理解，简单来说就是当用户点击确定时
    // 我主动调用 _resolve 方法，该方法会调用 modalCallbacks[id].resolve
    // 然后又因为 modalCallbacks[id].resolve 是由下方的 promise 赋值的，
    // 所以，调用之后就会触发该 promise 的 .then 方法
    const promise = new Promise((resolve, reject) => {
      theResolve = resolve
      theReject = reject
    })
    modalCallbacks[id] = {
      promise,
      resolve: theResolve,
      reject: theReject,
    }
  }

  return modalCallbacks[id].promise
}

export const hide = (id: string) => {
  if (!dialogMap.has(id)) {
    return console.warn(`不存在该${id}的组件`)
  }

  delete modalCallbacks[id]

  dialogMap.set(id, {
    id,
    props: {
      ...dialogMap.get(id)?.props,
      'model-value': false,
    },
  })
}

const _resolve = (id: string, args: any) => {
  modalCallbacks[id].resolve(args)
  delete modalCallbacks[id]
}

const _reject = (id: string, args: any) => {
  modalCallbacks[id].reject(args)
  delete modalCallbacks[id]
}

// createModal 用于创建组件内部可以调用的方法
export const createModal = (id: string) => {
  return {
    resolve: (_args: any) => _resolve(id, _args),
    reject: (_args: any) => _reject(id, _args),
    hide: () => hide(id),
  }
}
```

#### 5. useModal

在用户写的组件里可以直接调用 `useModal` 去获取到 `createModal` 返回的 `resolve, reject, hide` 方法。

```ts
export const useModal = (): ModalType | undefined => {
  const modalId = inject(injectModalIdKey)

  if (!modalId) {
    console.warn('不存在 modalId')
    return undefined
  }

  return createModal(modalId as string)
}
```

这里 `inject` 所获取的信息是在 `ModalProvide` 中去设置的，当然也可以利用 `attrs` 下传，这样就可以去除 `ModalProvide` ， 我这里还是用 `provide/inject` 更贴近 `NiceModalReact` 那种写法，且避免用户直接在 ` DOM 树` 上看到我定义的属性。

```vue
<!-- ModalProvide.vue 实现 -->
<script setup lang="ts">
import { provide, defineProps } from 'vue'
import { injectModalIdKey } from './utils/pnm-modal-vue'
// modalId 就是 dialogMap 的 key ，用来找到
const props = defineProps({
  modalId: String,
})

provide(injectModalIdKey, props.modalId)
</script>

<template>
  <slot></slot>
</template>
```

### 具体用法

#### 1. 普通用法

```ts
import { modalRegister, injectModalKey } from '@pnm/pnm-modal'
import TempModal from './TempModal.vue'
// # 在某处注册组件，
// 可以是 main.ts 页面
app.use(pnmModalVue, {
  'temp-modal1', TempModal
})

// 也可以是App页面或其他页面，注册一次即可，相同 id 会被覆盖
modalRegister('temp-modal2', TempModal)

// # 调用组件， 任意Vue页面调用
const $modal = inject(injectModalKey)

$modal?.show('temp-modal1').then((res) => {
  console.log('....', res)
})
```

```vue
<!-- TempModal.vue 内部实现 -->

<script lang="ts" setup>
import { useModal } from '@pnm/pnm-modal'
import { ElDialog, ElButton } from 'element-plus'

const modal = useModal()

// resolve 会触发 show('id').then
const onOk = () => {
  modal?.resolve('ok')
  modal?.hide()
}

// reject 会触发 show('id').catch
const onCancel = () => {
  modal?.reject()
  modal?.hide()
}

// dialog的关闭时，必须调用 modal.hide 去清空里面的promise数据，
// 然后 dialog 会在用户按下 Esc，点击Mask 时都会自动关闭
// 所以需要在 onClose 中处理，或者可以在 before-close 这个属性里处理
const onClose = () => {
  modal?.hide()
}
</script>

<template>
  <ElDialog title="Title" @close="onClose">
    Default...

    <template #footer>
      <ElButton @click="onCancel">取消</ElButton>
      <ElButton type="primary" @click="onOk">确定</ElButton>
    </template>
  </ElDialog>
</template>
```

#### 2. 使用 PnmDialog 组件

`PnmDialog` 组件将一些方法，插槽封装了，方便用户使用。
此外也封装了 `PnmDrawer` 组件，如果由其他业务需求，可由用户自行封装。

```vue
<script lang="ts" setup>
import { useModal } from '@pnm/pnm-modal'
import { ElDialog, ElButton, dialogEmits, dialogProps } from 'element-plus'
import { computed, useSlots } from 'vue'
const emits = defineEmits({ ...dialogEmits })
const props = defineProps({ ...dialogProps, onOk: Function, onCancel: Function })
const modal = useModal()
const slots = useSlots()

const onOk = () => {
  // 由于无法知道父组件是否定义了 emits 的事件，所以可以用下面这2种方法
  // 1. 用 attrs ，能知道父组件是否传递，但会没有类型提示
  // 2. 用 props ，有类型提示且能知道父组件是否传递了该属性
  // if (attrs.onOk) return attrs?.onOk?.()
  if (props?.onOk) return props?.onOk?.()

  modal?.resolve()
  modal?.hide()
}

const onCancel = () => {
  // if (attrs.onCancel) return attrs?.onCancel?.()
  if (props?.onCancel) return props?.onCancel?.()

  modal?.reject()
  modal?.hide()
}

// 点击 x 按钮, 点击 mask, 按 ESC 会调用
const onBeforeClose = (done) => {
  modal?.hide()
  done()
}

const events = computed(() => {
  const keys = Object.keys(dialogEmits)
  return keys.reduce((total, current) => {
    total[current] = emits.bind(null, current as any)
    return total
  }, {})
})

// 因为 onOk , onCancel 是给按钮用的，不需要放在 ElDialog 中，所以这里用计算属性过滤掉
const bindProps = computed(() => {
  return { ...props, onOk: undefined, onCancel: undefined }
})
</script>

<template>
  <ElDialog
    v-bind="{ ...bindProps, beforeClose: bindProps?.beforeClose || onBeforeClose, destroyOnClose: true }"
    v-on="{ ...events }"
  >
    <template v-for="(item, key, i) in slots" :key="i" #[key]>
      <slot :name="key"></slot>
    </template>

    <template #footer>
      <ElButton @click="onCancel">取消</ElButton>
      <ElButton type="primary" @click="onOk">确定</ElButton>
    </template>
  </ElDialog>
</template>
```

把一些 `dialog` 的事件，属性都封装了，然后用户如果需要复写 `onOk ，onCancel` 直接传递即可，插槽、属性（除了 `destroyOnClose`）都可以由用户重新覆盖。

此时我们再写上述的 `TempModal.vue` 弹窗，就变得异常简单。

```vue
<script lang="ts" setup>
import { PnmDialog, useModal } from '@pnm/pnm-modal'

const modal = useModal()

// 如果遇到一些更复杂的需求，支持用户改写确定，取消弹窗的事件
// 不写也可以， PnmDialog 内部都封装了
const onOk = () => {
  modal?.resolve()
  modal?.hide()
}
</script>

<template>
  <PnmDialog title="Title" @ok="onOk"> Default... </PnmDialog>
</template>
```

### 总结

这次封装最难受的是类型方面，踩了好多坑，Vue 有 `泛型声明` 和 `运行时声明` ，而泛型声明又有语法限制，只支持内部导入和字面量写法（[详见文档](https://cn.vuejs.org/guide/typescript/composition-api.html#typing-component-props)）相当难顶。。。最终就采用了 `运行时声明` 的写法。

中途也做了一些其他尝试，比如把 `Slot` 的封装交给一个函数，然后再函数里面调用 `createVNode` 的写法，结果又遇到了层级的坑，导致夭折。。

该项目源码位于 `My Github` ，因为不会怎么去维护，项目就不放 `npm` 仓库了 （当然我晓得也不会有人去下，但话还是得说 QAQ）。如有其他需求，请直接拉源码改。
