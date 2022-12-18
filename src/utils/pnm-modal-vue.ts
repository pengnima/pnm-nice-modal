import { DialogProps, DrawerProps } from 'element-plus'
import { App, createApp, DefineComponent, inject, InjectionKey, reactive } from 'vue'
import PnmModalVue from '../PnmModal.vue'

interface ModalType {
  resolve: (args?: any) => void
  reject: (args?: any) => void
  hide: (args?: any) => void
}

// 为 provide / inject 标注类型 ，vue3文档有
export const injectModalKey = Symbol() as InjectionKey<InstanceType<typeof PnmModalVue>>
export const injectModalIdKey = '__MODAL__ID__'
export const REGISTER_MODAL: Record<string, any> = {}
export const modalCallbacks: Record<string, any> = {} // 包含 modal 的 promise 等方法
let pnmModalApp: App<Element>
export const dialogMap = reactive<Map<string, { id: string; props: any }>>(new Map([]))

const _checkProps = (id: string, propsName: string = 'model-value') => {
  return dialogMap.get(id)?.props?.[propsName]
}

export const _init = (id: string, props?: Partial<DialogProps | DrawerProps>) => {
  dialogMap.set(id, {
    id,
    props,
  })
}

export const show = (id: string, props?: Partial<DialogProps | DrawerProps>): Promise<any> => {
  if (!_checkProps(id)) {
    dialogMap.set(id, {
      id,
      props: {
        ...props,
        'model-value': true,
      },
    })
  }

  if (!modalCallbacks[id]) {
    let theResolve: any, theReject: any

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

  if (modalCallbacks.hasOwnProperty(id)) {
    delete modalCallbacks[id]
  }

  if (_checkProps(id)) {
    dialogMap.set(id, {
      id,
      props: {
        ...dialogMap.get(id)?.props,
        'model-value': false,
      },
    })
  }
}

const _resolve = (id: string, args: any) => {
  if (!modalCallbacks[id]) {
    return console.warn('不存在 modalCallback')
  }
  modalCallbacks[id].resolve(args)
  delete modalCallbacks[id]
}

const _reject = (id: string, args: any) => {
  if (!modalCallbacks[id]) {
    return console.warn('不存在 modalCallback')
  }

  modalCallbacks[id].reject(args)
  delete modalCallbacks[id]
}

export const createModal = (id: string) => {
  return {
    resolve: (_args: any) => _resolve(id, _args),
    reject: (_args: any) => _reject(id, _args),
    hide: () => hide(id),
  }
}

/**
 * 注册
 *
 * @param id
 * @param comp
 * @param props
 */
export const register = (
  id: string,
  comp: DefineComponent<any, any, any>,
  props?: Partial<DialogProps | DrawerProps>
) => {
  REGISTER_MODAL[id] = { id, props }
  pnmModalApp.component(id, comp)

  _init(id, props)
}

export const useModal = (): ModalType | undefined => {
  const modalId = inject(injectModalIdKey)

  if (!modalId) {
    console.warn('不存在 modalId')
    return undefined
  }

  return createModal(modalId as string)
}

/**
 * 被 vue 装载为插件，需要提供 install 方法
 *
 * @param app
 * @param options
 */
const install = (app: App<Element>, options?: any) => {
  // 1. 创建一个组件app实例
  pnmModalApp = createApp(PnmModalVue)

  // 2. 将其挂载，并追加到真实节点上
  const pnmModalMount = pnmModalApp.mount(document.createElement('div'))
  document.body.appendChild(pnmModalMount.$el)

  // 3. 处理 options。 我这里是用了注册
  for (const key in options) {
    pnmModalApp.component(key, options[key])
    register(key, options[key])
  }

  // 4. 将 $modal 抛出， 问题： 外部 inject 的时候，会没有类型。
  // app.config.globalProperties.$modal = pnmModalMount
  app.provide(injectModalKey, pnmModalMount as any)
}

const obj = {
  install,
}

export default obj
