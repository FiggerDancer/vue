/* @flow */

import VNode from '../vnode'
import { createFnInvoker } from './update-listeners'
import { remove, isDef, isUndef, isTrue } from 'shared/util'

export function mergeVNodeHook (def: Object, hookKey: string, hook: Function) {
  if (def instanceof VNode) {
    def = def.data.hook || (def.data.hook = {})
  }
  let invoker
  const oldHook = def[hookKey]

  function wrappedHook () {
    hook.apply(this, arguments)
    // important: remove merged hook to ensure it's called only once
    // and prevent memory leak
    // 移除合并的钩子保证它只会被调用一次并且阻止内存泄漏
    remove(invoker.fns, wrappedHook)
  }

  // 存在就一块儿调用
  if (isUndef(oldHook)) {
    // no existing hook
    invoker = createFnInvoker([wrappedHook])
  } else {
    /* istanbul ignore if */
    if (isDef(oldHook.fns) && isTrue(oldHook.merged)) {
      // already a merged invoker
      invoker = oldHook
      invoker.fns.push(wrappedHook)
    } else {
      // existing plain hook
      invoker = createFnInvoker([oldHook, wrappedHook])
    }
  }

  invoker.merged = true
  def[hookKey] = invoker
}
