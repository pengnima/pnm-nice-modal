import { reactive, inject, createApp, defineComponent, provide, renderSlot, openBlock, createElementBlock, Fragment, renderList, unref, createBlock, withCtx, resolveDynamicComponent, normalizeProps, guardReactiveProps, useSlots, computed, mergeProps, toHandlers, createSlots, createVNode, createTextVNode } from "vue";
import { dialogProps, dialogEmits, ElDialog, ElButton, drawerProps, drawerEmits, ElDrawer } from "element-plus";
const injectModalKey = Symbol();
const injectModalIdKey = "__MODAL__ID__";
const REGISTER_MODAL = {};
const modalCallbacks = {};
let pnmModalApp;
const dialogMap = reactive(/* @__PURE__ */ new Map([]));
const _checkProps = (id, propsName = "model-value") => {
  var _a, _b;
  return (_b = (_a = dialogMap.get(id)) == null ? void 0 : _a.props) == null ? void 0 : _b[propsName];
};
const _init = (id, props) => {
  dialogMap.set(id, {
    id,
    props
  });
};
const show = (id, props) => {
  if (!_checkProps(id)) {
    dialogMap.set(id, {
      id,
      props: {
        ...props,
        "model-value": true
      }
    });
  }
  if (!modalCallbacks[id]) {
    let theResolve, theReject;
    const promise = new Promise((resolve, reject) => {
      theResolve = resolve;
      theReject = reject;
    });
    modalCallbacks[id] = {
      promise,
      resolve: theResolve,
      reject: theReject
    };
  }
  return modalCallbacks[id].promise;
};
const hide = (id) => {
  var _a;
  if (!dialogMap.has(id)) {
    return console.warn(`\u4E0D\u5B58\u5728\u8BE5${id}\u7684\u7EC4\u4EF6`);
  }
  if (modalCallbacks.hasOwnProperty(id)) {
    delete modalCallbacks[id];
  }
  if (_checkProps(id)) {
    dialogMap.set(id, {
      id,
      props: {
        ...(_a = dialogMap.get(id)) == null ? void 0 : _a.props,
        "model-value": false
      }
    });
  }
};
const _resolve = (id, args) => {
  if (!modalCallbacks[id]) {
    return console.warn("\u4E0D\u5B58\u5728 modalCallback");
  }
  modalCallbacks[id].resolve(args);
  delete modalCallbacks[id];
};
const _reject = (id, args) => {
  if (!modalCallbacks[id]) {
    return console.warn("\u4E0D\u5B58\u5728 modalCallback");
  }
  modalCallbacks[id].reject(args);
  delete modalCallbacks[id];
};
const createModal = (id) => {
  return {
    resolve: (_args) => _resolve(id, _args),
    reject: (_args) => _reject(id, _args),
    hide: () => hide(id)
  };
};
const register = (id, comp, props) => {
  REGISTER_MODAL[id] = { id, props };
  pnmModalApp.component(id, comp);
  _init(id, props);
};
const useModal = () => {
  const modalId = inject(injectModalIdKey);
  if (!modalId) {
    console.warn("\u4E0D\u5B58\u5728 modalId");
    return void 0;
  }
  return createModal(modalId);
};
const install = (app, options) => {
  pnmModalApp = createApp(PnmModalVue);
  const pnmModalMount = pnmModalApp.mount(document.createElement("div"));
  document.body.appendChild(pnmModalMount.$el);
  for (const key in options) {
    pnmModalApp.component(key, options[key]);
    register(key, options[key]);
  }
  app.provide(injectModalKey, pnmModalMount);
};
const obj = {
  install
};
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "ModalProvide",
  props: {
    modalId: String
  },
  setup(__props) {
    const props = __props;
    provide(injectModalIdKey, props.modalId);
    return (_ctx, _cache) => {
      return renderSlot(_ctx.$slots, "default");
    };
  }
});
const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const ModalProvide = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["__file", "D:/Desktop/pnm-modal/src/ModalProvide.vue"]]);
const _hoisted_1 = { class: "pnm_modal__container" };
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "PnmModal",
  setup(__props, { expose }) {
    expose({
      show,
      hide
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1, [
        (openBlock(true), createElementBlock(Fragment, null, renderList(unref(dialogMap), ([key, value]) => {
          return openBlock(), createBlock(ModalProvide, {
            key,
            modalId: key
          }, {
            default: withCtx(() => [
              (openBlock(), createBlock(resolveDynamicComponent(key), normalizeProps(guardReactiveProps({ ...unref(REGISTER_MODAL)[key].props, ...value.props })), null, 16))
            ]),
            _: 2
          }, 1032, ["modalId"]);
        }), 128))
      ]);
    };
  }
});
const PnmModalVue = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__file", "D:/Desktop/pnm-modal/src/PnmModal.vue"]]);
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "PnmDialog",
  props: { ...dialogProps, onOk: Function, onCancel: Function },
  emits: { ...dialogEmits },
  setup(__props, { emit: emits }) {
    const props = __props;
    const modal = useModal();
    const slots = useSlots();
    const onOkFunc = () => {
      var _a;
      if (props == null ? void 0 : props.onOk)
        return (_a = props == null ? void 0 : props.onOk) == null ? void 0 : _a.call(props);
      modal == null ? void 0 : modal.resolve();
      modal == null ? void 0 : modal.hide();
    };
    const onCancelFunc = () => {
      var _a;
      if (props == null ? void 0 : props.onCancel)
        return (_a = props == null ? void 0 : props.onCancel) == null ? void 0 : _a.call(props);
      modal == null ? void 0 : modal.reject();
      modal == null ? void 0 : modal.hide();
    };
    const onBeforeClose = (done) => {
      modal == null ? void 0 : modal.hide();
      done();
    };
    const events = computed(() => {
      const keys = Object.keys(dialogEmits);
      return keys.reduce((total, current) => {
        total[current] = emits.bind(null, current);
        return total;
      }, {});
    });
    const bindProps = computed(() => {
      return { ...props, onOk: void 0, onCancel: void 0 };
    });
    return (_ctx, _cache) => {
      var _a;
      return openBlock(), createBlock(unref(ElDialog), mergeProps({ ...unref(bindProps), beforeClose: ((_a = unref(bindProps)) == null ? void 0 : _a.beforeClose) || onBeforeClose, destroyOnClose: true }, toHandlers({ ...unref(events) })), createSlots({
        footer: withCtx(() => [
          createVNode(unref(ElButton), { onClick: onCancelFunc }, {
            default: withCtx(() => [
              createTextVNode("\u53D6\u6D88")
            ]),
            _: 1
          }),
          createVNode(unref(ElButton), {
            type: "primary",
            onClick: onOkFunc
          }, {
            default: withCtx(() => [
              createTextVNode("\u786E\u5B9A")
            ]),
            _: 1
          })
        ]),
        _: 2
      }, [
        renderList(unref(slots), (_, name, i) => {
          return {
            name,
            fn: withCtx((data) => [
              renderSlot(_ctx.$slots, name, normalizeProps(guardReactiveProps(data)))
            ])
          };
        })
      ]), 1040);
    };
  }
});
const PnmDialog = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__file", "D:/Desktop/pnm-modal/src/PnmDialog.vue"]]);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "PnmDrawer",
  props: { ...drawerProps, onOk: Function, onCancel: Function },
  emits: { ...drawerEmits },
  setup(__props, { emit: emits }) {
    const props = __props;
    const modal = useModal();
    const slots = useSlots();
    const onOkFunc = () => {
      var _a;
      if (props == null ? void 0 : props.onOk)
        return (_a = props == null ? void 0 : props.onOk) == null ? void 0 : _a.call(props);
      modal == null ? void 0 : modal.resolve();
      modal == null ? void 0 : modal.hide();
    };
    const onCancelFunc = () => {
      var _a;
      if (props == null ? void 0 : props.onCancel)
        return (_a = props == null ? void 0 : props.onCancel) == null ? void 0 : _a.call(props);
      modal == null ? void 0 : modal.reject();
      modal == null ? void 0 : modal.hide();
    };
    const onBeforeClose = (done) => {
      modal == null ? void 0 : modal.hide();
      done();
    };
    const events = computed(() => {
      const keys = Object.keys(drawerEmits);
      return keys.reduce((total, current) => {
        total[current] = emits.bind(null, current);
        return total;
      }, {});
    });
    const bindProps = computed(() => {
      return { ...props, onOk: void 0, onCancel: void 0 };
    });
    return (_ctx, _cache) => {
      var _a;
      return openBlock(), createBlock(unref(ElDrawer), mergeProps({ ...unref(bindProps), beforeClose: ((_a = unref(bindProps)) == null ? void 0 : _a.beforeClose) || onBeforeClose, destroyOnClose: true }, toHandlers({ ...unref(events) })), createSlots({
        footer: withCtx(() => [
          createVNode(unref(ElButton), { onClick: onCancelFunc }, {
            default: withCtx(() => [
              createTextVNode("\u53D6\u6D88")
            ]),
            _: 1
          }),
          createVNode(unref(ElButton), {
            type: "primary",
            onClick: onOkFunc
          }, {
            default: withCtx(() => [
              createTextVNode("\u786E\u5B9A")
            ]),
            _: 1
          })
        ]),
        _: 2
      }, [
        renderList(unref(slots), (_, name, i) => {
          return {
            name,
            fn: withCtx((data) => [
              renderSlot(_ctx.$slots, name, normalizeProps(guardReactiveProps(data)))
            ])
          };
        })
      ]), 1040);
    };
  }
});
const PnmDrawer = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "D:/Desktop/pnm-modal/src/PnmDrawer.vue"]]);
export {
  PnmDialog,
  PnmDrawer,
  PnmModalVue as PnmModal,
  injectModalKey,
  register as modalRegister,
  obj as pnmModalVue,
  useModal
};
