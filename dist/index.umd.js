(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require("vue"), require("element-plus")) : typeof define === "function" && define.amd ? define(["exports", "vue", "element-plus"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.PnmModal = {}, global.Vue, global.ElementPlus));
})(this, function(exports2, vue, elementPlus) {
  "use strict";
  const injectModalKey = Symbol();
  const injectModalIdKey = "__MODAL__ID__";
  const REGISTER_MODAL = {};
  const modalCallbacks = {};
  let pnmModalApp;
  const dialogMap = vue.reactive(/* @__PURE__ */ new Map([]));
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
    const modalId = vue.inject(injectModalIdKey);
    if (!modalId) {
      console.warn("\u4E0D\u5B58\u5728 modalId");
      return void 0;
    }
    return createModal(modalId);
  };
  const install = (app, options) => {
    pnmModalApp = vue.createApp(PnmModalVue);
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
  const _sfc_main$3 = /* @__PURE__ */ vue.defineComponent({
    __name: "ModalProvide",
    props: {
      modalId: String
    },
    setup(__props) {
      const props = __props;
      vue.provide(injectModalIdKey, props.modalId);
      return (_ctx, _cache) => {
        return vue.renderSlot(_ctx.$slots, "default");
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
  const _sfc_main$2 = /* @__PURE__ */ vue.defineComponent({
    __name: "PnmModal",
    setup(__props, { expose }) {
      expose({
        show,
        hide
      });
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1, [
          (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(vue.unref(dialogMap), ([key, value]) => {
            return vue.openBlock(), vue.createBlock(ModalProvide, {
              key,
              modalId: key
            }, {
              default: vue.withCtx(() => [
                (vue.openBlock(), vue.createBlock(vue.resolveDynamicComponent(key), vue.normalizeProps(vue.guardReactiveProps({ ...vue.unref(REGISTER_MODAL)[key].props, ...value.props })), null, 16))
              ]),
              _: 2
            }, 1032, ["modalId"]);
          }), 128))
        ]);
      };
    }
  });
  const PnmModalVue = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__file", "D:/Desktop/pnm-modal/src/PnmModal.vue"]]);
  const _sfc_main$1 = /* @__PURE__ */ vue.defineComponent({
    __name: "PnmDialog",
    props: { ...elementPlus.dialogProps, onOk: Function, onCancel: Function },
    emits: { ...elementPlus.dialogEmits },
    setup(__props, { emit: emits }) {
      const props = __props;
      const modal = useModal();
      const slots = vue.useSlots();
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
      const events = vue.computed(() => {
        const keys = Object.keys(elementPlus.dialogEmits);
        return keys.reduce((total, current) => {
          total[current] = emits.bind(null, current);
          return total;
        }, {});
      });
      const bindProps = vue.computed(() => {
        return { ...props, onOk: void 0, onCancel: void 0 };
      });
      return (_ctx, _cache) => {
        var _a;
        return vue.openBlock(), vue.createBlock(vue.unref(elementPlus.ElDialog), vue.mergeProps({ ...vue.unref(bindProps), beforeClose: ((_a = vue.unref(bindProps)) == null ? void 0 : _a.beforeClose) || onBeforeClose, destroyOnClose: true }, vue.toHandlers({ ...vue.unref(events) })), vue.createSlots({
          footer: vue.withCtx(() => [
            vue.createVNode(vue.unref(elementPlus.ElButton), { onClick: onCancelFunc }, {
              default: vue.withCtx(() => [
                vue.createTextVNode("\u53D6\u6D88")
              ]),
              _: 1
            }),
            vue.createVNode(vue.unref(elementPlus.ElButton), {
              type: "primary",
              onClick: onOkFunc
            }, {
              default: vue.withCtx(() => [
                vue.createTextVNode("\u786E\u5B9A")
              ]),
              _: 1
            })
          ]),
          _: 2
        }, [
          vue.renderList(vue.unref(slots), (_, name, i) => {
            return {
              name,
              fn: vue.withCtx((data) => [
                vue.renderSlot(_ctx.$slots, name, vue.normalizeProps(vue.guardReactiveProps(data)))
              ])
            };
          })
        ]), 1040);
      };
    }
  });
  const PnmDialog = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__file", "D:/Desktop/pnm-modal/src/PnmDialog.vue"]]);
  const _sfc_main = /* @__PURE__ */ vue.defineComponent({
    __name: "PnmDrawer",
    props: { ...elementPlus.drawerProps, onOk: Function, onCancel: Function },
    emits: { ...elementPlus.drawerEmits },
    setup(__props, { emit: emits }) {
      const props = __props;
      const modal = useModal();
      const slots = vue.useSlots();
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
      const events = vue.computed(() => {
        const keys = Object.keys(elementPlus.drawerEmits);
        return keys.reduce((total, current) => {
          total[current] = emits.bind(null, current);
          return total;
        }, {});
      });
      const bindProps = vue.computed(() => {
        return { ...props, onOk: void 0, onCancel: void 0 };
      });
      return (_ctx, _cache) => {
        var _a;
        return vue.openBlock(), vue.createBlock(vue.unref(elementPlus.ElDrawer), vue.mergeProps({ ...vue.unref(bindProps), beforeClose: ((_a = vue.unref(bindProps)) == null ? void 0 : _a.beforeClose) || onBeforeClose, destroyOnClose: true }, vue.toHandlers({ ...vue.unref(events) })), vue.createSlots({
          footer: vue.withCtx(() => [
            vue.createVNode(vue.unref(elementPlus.ElButton), { onClick: onCancelFunc }, {
              default: vue.withCtx(() => [
                vue.createTextVNode("\u53D6\u6D88")
              ]),
              _: 1
            }),
            vue.createVNode(vue.unref(elementPlus.ElButton), {
              type: "primary",
              onClick: onOkFunc
            }, {
              default: vue.withCtx(() => [
                vue.createTextVNode("\u786E\u5B9A")
              ]),
              _: 1
            })
          ]),
          _: 2
        }, [
          vue.renderList(vue.unref(slots), (_, name, i) => {
            return {
              name,
              fn: vue.withCtx((data) => [
                vue.renderSlot(_ctx.$slots, name, vue.normalizeProps(vue.guardReactiveProps(data)))
              ])
            };
          })
        ]), 1040);
      };
    }
  });
  const PnmDrawer = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "D:/Desktop/pnm-modal/src/PnmDrawer.vue"]]);
  exports2.PnmDialog = PnmDialog;
  exports2.PnmDrawer = PnmDrawer;
  exports2.PnmModal = PnmModalVue;
  exports2.injectModalKey = injectModalKey;
  exports2.modalRegister = register;
  exports2.pnmModalVue = obj;
  exports2.useModal = useModal;
  Object.defineProperties(exports2, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
});
