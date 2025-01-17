/* @flow */

let decoder

export default {
  // 通过dom元素解码html
  decode (html: string): string {
    decoder = decoder || document.createElement('div')
    decoder.innerHTML = html
    return decoder.textContent
  }
}
