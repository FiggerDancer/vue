/* @flow */

import deindent from 'de-indent'
import { parseHTML } from 'compiler/parser/html-parser'
import { makeMap } from 'shared/util'

// 分隔符正则表达式 换行
const splitRE = /\r?\n/g
// 替换，任意元素
const replaceRE = /./g
// 特殊标签
const isSpecialTag = makeMap('script,style,template', true)

/**
 * 解析一个单文件组件
 * Parse a single-file component (*.vue) file into an SFC Descriptor Object.
 */
export function parseComponent (
  content: string,
  options?: Object = {}
): SFCDescriptor {
  const sfc: SFCDescriptor = {
    template: null,
    script: null,
    styles: [],
    customBlocks: [],
    errors: []
  }
  let depth = 0
  let currentBlock: ?SFCBlock = null

  let warn = msg => {
    sfc.errors.push(msg)
  }

  if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
    warn = (msg, range) => {
      const data: WarningMessage = { msg }
      if (range.start != null) {
        data.start = range.start
      }
      if (range.end != null) {
        data.end = range.end
      }
      sfc.errors.push(data)
    }
  }

  // 开标签
  function start (
    tag: string,
    attrs: Array<ASTAttr>,
    unary: boolean,
    start: number,
    end: number
  ) {
    if (depth === 0) { // 闭口时
      currentBlock = {
        type: tag,
        content: '',
        start: end,
        attrs: attrs.reduce((cumulated, { name, value }) => {
          cumulated[name] = value || true
          return cumulated
        }, {}) // 生成属性map
      }
      if (isSpecialTag(tag)) {
        checkAttrs(currentBlock, attrs)
        if (tag === 'style') { // 从者能够看出允许多个style，但只允许一个template和一个script
          sfc.styles.push(currentBlock)
        } else {
          sfc[tag] = currentBlock
        }
      } else { // custom blocks // 自定义模块
        sfc.customBlocks.push(currentBlock)
      }
    }
    if (!unary) { // 不是单元的话 开口
      depth++ // 表示开口
    }
  }

  // 给sfcBlock赋值
  function checkAttrs (block: SFCBlock, attrs: Array<ASTAttr>) {
    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i]
      if (attr.name === 'lang') {
        block.lang = attr.value
      }
      if (attr.name === 'scoped') {
        block.scoped = true
      }
      if (attr.name === 'module') {
        block.module = attr.value || true
      }
      if (attr.name === 'src') {
        block.src = attr.value
      }
    }
  }

  // 闭合标签
  function end (tag: string, start: number) {
    if (depth === 1 && currentBlock) {
      currentBlock.end = start
      // 截取开合标签内的文本
      let text = content.slice(currentBlock.start, currentBlock.end)
      if (options.deindent !== false) {
        text = deindent(text) // 文本缩进
      }
      // pad content so that linters and pre-processors can output correct
      // line numbers in errors and warnings
      // 填充内容让预处理器能够输出错误和警告中所指的具体位置（行数）
      if (currentBlock.type !== 'template' && options.pad) {
        text = padContent(currentBlock, options.pad) + text
        /*
          举个例子：
          <template>
            <div></div>
          </template>
          <script>
            const hello = () => {}
          </script>

          上面的例子中收集script时通过这个padContent就转化为



            const hello = () => {}

          这样一种结构，可以准确知道hello的行数
        */
      }
      currentBlock.content = text
      currentBlock = null
    }
    // 闭合后重置depth
    depth--
  }

  function padContent (block: SFCBlock, pad: true | "line" | "space") {
    if (pad === 'space') {
      return content.slice(0, block.start).replace(replaceRE, ' ')
    } else {
      const offset = content.slice(0, block.start).split(splitRE).length
      const padChar = block.type === 'script' && !block.lang
        ? '//\n'
        : '\n'
      return Array(offset).join(padChar)
    }
  }

  parseHTML(content, {
    warn,
    start,
    end,
    outputSourceRange: options.outputSourceRange
  })

  return sfc
}
