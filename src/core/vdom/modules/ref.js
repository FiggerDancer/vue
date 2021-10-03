/* @flow */

import { remove, isDef } from 'shared/util'

export default {
  create (_: any, vnode: VNodeWithData) { // 钩子，创建时键入
    registerRef(vnode)
  },
  update (oldVnode: VNodeWithData, vnode: VNodeWithData) { // 更新
    if (oldVnode.data.ref !== vnode.data.ref) {
      registerRef(oldVnode, true) // 移除旧的
      registerRef(vnode)
    }
  },
  destroy (vnode: VNodeWithData) { // 移除
    registerRef(vnode, true)
  }
}

// 注册ref
export function registerRef (vnode: VNodeWithData, isRemoval: ?boolean) {
  const key = vnode.data.ref
  if (!isDef(key)) return

  const vm = vnode.context
  const ref = vnode.componentInstance || vnode.elm
  const refs = vm.$refs
  if (isRemoval) {
    if (Array.isArray(refs[key])) {
      remove(refs[key], ref)
    } else if (refs[key] === ref) {
      refs[key] = undefined
    }
  } else {
    if (vnode.data.refInFor) {
      if (!Array.isArray(refs[key])) {
        refs[key] = [ref]
      } else if (refs[key].indexOf(ref) < 0) {
        // $flow-disable-line
        refs[key].push(ref)
      }
    } else {
      refs[key] = ref
    }
  }
}
