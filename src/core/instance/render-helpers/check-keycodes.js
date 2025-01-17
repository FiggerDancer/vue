/* @flow */

import config from 'core/config'
import { hyphenate } from 'shared/util'

function isKeyNotMatch<T> (expect: T | Array<T>, actual: T): boolean {
  if (Array.isArray(expect)) {
    return expect.indexOf(actual) === -1
  } else {
    return expect !== actual
  }
}

/**
 * 用于检查配置中的keyCodes的运行时助手。 暴露为Vue.prototype._k 单独传入eventKeyName作为最后一个参数用于向后compat
 * Runtime helper for checking keyCodes from config.
 * exposed as Vue.prototype._k
 * passing in eventKeyName as last argument separately for backwards compat
 */
export function checkKeyCodes (
  eventKeyCode: number,
  key: string,
  builtInKeyCode?: number | Array<number>,
  eventKeyName?: string,
  builtInKeyName?: string | Array<string>
): ?boolean {
  const mappedKeyCode = config.keyCodes[key] || builtInKeyCode
  if (builtInKeyName && eventKeyName && !config.keyCodes[key]) {
    return isKeyNotMatch(builtInKeyName, eventKeyName)
  } else if (mappedKeyCode) {
    return isKeyNotMatch(mappedKeyCode, eventKeyCode)
  } else if (eventKeyName) {
    return hyphenate(eventKeyName) !== key
  }
  return eventKeyCode === undefined
}
