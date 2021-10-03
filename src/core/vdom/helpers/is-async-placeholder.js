/* @flow */
// 判断是否是异步占位符
export function isAsyncPlaceholder (node: VNode): boolean {
  return node.isComment && node.asyncFactory
}
