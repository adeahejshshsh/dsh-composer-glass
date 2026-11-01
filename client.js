/**
 * dsh-composer-glass —— 底栏改造（外置插件）。
 *
 * 从内置 dsh-client-ui-responsive 里抽出来的同一套实现：
 *   1. 把编辑器块搬进按钮行，让输入框落在「+」与「发送」之间；
 *   2. 权限 / 模型提到输入框上方一行（灰字，点开可改）；
 *   3. 有附件或多行输入时，内层从细长药丸切回圆角矩形；
 *   4. 占位文字 top 归零、发送键 transform 归零、行 gap 归零；
 *   5. 放大输入区座位的渐变区域（不新增层）。
 *
 * 全部按结构定位，不依赖上游 hashed 类名。上传用的 input[type=file] 有硬约束：
 * 搬完必须仍在卡片内，否则整轮回滚。
 */
(() => {
  try {
    window.__ModuleLoader__.load({
      id: 'dsh-composer-glass',
      factory: (require) => {
        var module = { exports: {} }
        var exports = module.exports

        var STYLE_ID = 'dsh-composer-glass-style'
        var GLASS_ATTR = 'data-dsh-composer-glass'
        var META_ATTR = 'data-dsh-composer-top'
        var ATTACH_ATTR = 'data-dsh-composer-attach'
        var MULTILINE_ATTR = 'data-dsh-composer-multiline'
        var HERO_ATTR = 'data-dsh-hero-control'
        var HERO_PAGE_ATTR = 'data-dsh-hero-page'
        var EDITOR_ATTR = 'data-dsh-composer-editor'

        var ADD_SELECTOR = "[data-composer-card] button[aria-label*='指令'], [data-composer-card] button[aria-label*='commands']"
        var SEND_SELECTOR = "[data-composer-card] button[aria-label*='发送'], [data-composer-card] button[aria-label*='send'], [data-composer-card] button[aria-label*='停止'], [data-composer-card] button[aria-label*='stop']"
        var MODEL_SELECTOR = "[data-composer-card] [aria-label*='选择模型'], [data-composer-card] [aria-label*='model']"
        var FILE_INPUT_SELECTOR = '[data-composer-card] input[type="file"]'

        function injectStyle() {
          if (document.getElementById(STYLE_ID) !== null) return
          var style = document.createElement('style')
          style.id = STYLE_ID
          style.textContent = [
            /* 容器：只作为 DOM 容器，不画任何东西 */
            'html[data-dsh-mobile-form] [' + GLASS_ATTR + ']{display:flex;flex-direction:column;gap:4px;width:100%;align-self:stretch;padding:0;border:0;background:none;box-shadow:none}',
            /* 内层：细长药丸 */
            'html[data-dsh-mobile-form] [' + GLASS_ATTR + '] [data-composer-card]{box-sizing:border-box;min-height:44px;padding:4px 6px 4px 4px;border-radius:999px;border:.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);box-shadow:0 1px 2px rgba(0,0,0,.04)}',
            /* 有附件 / 多行：切圆角矩形 */
            'html[data-dsh-mobile-form] [' + GLASS_ATTR + '][' + ATTACH_ATTR + '] [data-composer-card],html[data-dsh-mobile-form] [' + GLASS_ATTR + '][' + MULTILINE_ATTR + '] [data-composer-card]{border-radius:22px;padding:8px 10px;min-height:0}',
            /* 首屏内容块：吃掉输入区上方空间并垂直居中（标题居中） */
            'html[data-dsh-mobile-form] [data-dsh-hero-content]{flex:1 1 auto!important;display:flex!important;flex-direction:column;justify-content:center}',
            /* 首屏（新会话空页）：标题在「上方空白」里垂直居中，输入区留在底部。
               结构实测：scrollBody(flex 列) > composerSeat > composerStack > [标题块, 输入区, dock] */
            'html[data-dsh-mobile-form] [' + HERO_PAGE_ATTR + '] [data-composer-seat]{flex:1 1 auto!important;margin-top:0!important}',
            'html[data-dsh-mobile-form] [' + HERO_PAGE_ATTR + '] [class*="composerStack"]{flex:1 1 auto!important}',
            'html[data-dsh-mobile-form] [' + HERO_PAGE_ATTR + '] [class*="composerStack"] > *:has([class*="_headline"]){margin-top:auto!important;margin-bottom:auto!important}',
            'html[data-dsh-mobile-form] [' + HERO_PAGE_ATTR + '] > div:empty{flex:0 0 0!important;height:0!important;min-height:0!important}',
            /* hero 那行（工作区 + Agent 预设）：只改样式，不搬节点 */
            /* 工作区 / Agent 预设：用户定例直接移除 */
            'html[data-dsh-mobile-form] [' + HERO_ATTR + ']{display:none!important}',
            /* 模型名过长时：名称可收缩并省略，思考强度（Effort）永不收缩、完整可见 */
            'html[data-dsh-mobile-form] [' + META_ATTR + '] [class*="_triggerLabel"]{flex:1 1 auto!important;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
            'html[data-dsh-mobile-form] [' + META_ATTR + '] [class*="_triggerEffort"]{flex:0 0 auto!important;flex-shrink:0!important;min-width:max-content;white-space:nowrap;overflow:visible}',
            'html[data-dsh-mobile-form] [' + META_ATTR + '] [aria-label*="选择模型"],html[data-dsh-mobile-form] [' + META_ATTR + '] [aria-label*="model"]{min-width:0;max-width:none}',
            /* 每条回复的「用量 X tok」：上游在 ≤480px 时把文字藏成图标（.Q51KRG_label{display:none}），
               这里恢复文字显示，并让触发器按内容宽度撑开。 */
            'html[data-dsh-mobile-form] [class*="endInfo"] button[aria-haspopup="dialog"]{width:auto!important;padding:0 6px!important}',
            'html[data-dsh-mobile-form] [class*="endInfo"] button[aria-haspopup="dialog"] [class*="_label"]{display:block!important}',
            /* 灰字行：权限靠左、模型靠右 */
            'html[data-dsh-mobile-form] [' + META_ATTR + ']{display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0;padding:0 6px;overflow:hidden;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:20px;min-height:20px}',
            'html[data-dsh-mobile-form] [' + META_ATTR + '] > *{min-width:0;flex:0 1 auto}',
            'html[data-dsh-mobile-form] [' + META_ATTR + '] > :last-child{margin-left:auto}',
            'html[data-dsh-mobile-form] [' + META_ATTR + '] > :first-child{margin-left:14px}',
                        /* 关闭菜单后不要留高亮：禁用文本选择/长按菜单，并把 focus/hover/active 的背景压平 */
            'html[data-dsh-mobile-form] [' + META_ATTR + '],html[data-dsh-mobile-form] [' + META_ATTR + '] *{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}',
            'html[data-dsh-mobile-form] [' + META_ATTR + '] button:focus,html[data-dsh-mobile-form] [' + META_ATTR + '] button:focus-visible,html[data-dsh-mobile-form] [' + META_ATTR + '] button:active,html[data-dsh-mobile-form] [' + META_ATTR + '] button:hover{background:transparent!important;box-shadow:none!important;outline:none!important}',
            'html[data-dsh-mobile-form] [' + META_ATTR + '] *::selection{background:transparent}',
            /* 展开态给底色（上游 :hover 用的同一个 token）；触屏 hover 会粘住，所以只认 aria-expanded */
            'html[data-dsh-mobile-form] [' + META_ATTR + '] button[aria-expanded="true"]{background:var(--dsw-alias-interactive-bg-hover)!important;outline:none!important;border-radius:var(--dsw-radius-sm)}',
'html[data-dsh-mobile-form] [' + META_ATTR + '] button,html[data-dsh-mobile-form] [' + META_ATTR + '] [role="button"]{height:20px;min-height:20px;padding:0 2px;background:transparent;border:0;font-size:12px;line-height:16px;color:var(--dsw-alias-label-secondary)}',
            'html[data-dsh-mobile-form] [' + META_ATTR + '] span{font-size:12px;line-height:16px}',
            /* 行容器：去掉 12px 行内间隙与不对称 padding */
            'html[data-dsh-mobile-form] [data-composer-card] > div:last-child{gap:0!important;padding:4px 6px!important;align-items:center!important}',
            /* 编辑器块与内部容器吃满宽度 */
            'html[data-dsh-mobile-form] [' + EDITOR_ATTR + ']{flex:1 1 0!important;width:auto!important;min-width:0;padding:0!important;margin:0 4px!important}',
            'html[data-dsh-mobile-form] [data-composer-card] div:has(> [data-composer-input]){display:flex;align-items:center;flex:1 1 auto!important;width:100%!important;min-width:0}',
            'html[data-dsh-mobile-form] [data-composer-card] [data-composer-input]{width:100%!important;flex:1 1 auto!important;min-height:24px;padding:0 8px 0 12px;line-height:24px}',
            /* 占位文字：上游 top:4px 会低 4px */
            'html[data-dsh-mobile-form] [data-composer-card] [data-composer-placeholder]{top:0!important;bottom:auto!important;height:24px;line-height:24px}',
            /* 发送侧只留按钮；发送键 transform 归零 */
            'html[data-dsh-mobile-form] [' + EDITOR_ATTR + '] ~ *{gap:0!important;flex:0 0 auto!important;width:auto!important;padding:0!important}',
            'html[data-dsh-mobile-form] [data-composer-card] button[aria-label*="发送"],html[data-dsh-mobile-form] [data-composer-card] button[aria-label*="send"],html[data-dsh-mobile-form] [data-composer-card] button[aria-label*="停止"],html[data-dsh-mobile-form] [data-composer-card] button[aria-label*="stop"]{width:30px;height:30px;min-width:30px;min-height:30px;margin:0!important;padding:0!important;align-self:center!important;transform:none!important}',
            /* 输入区座位：放大原渐变（盒子上扩 44px，内容不动） */
            'html[data-dsh-mobile-form] [data-composer-seat]{margin-top:-40px;padding-top:40px;background-image:linear-gradient(transparent 0px,var(--dsw-alias-bg-layer-1) 84px)}',
          ].join('')
          document.head.appendChild(style)
        }

        function findRow(card) {
          var add = card.querySelector(ADD_SELECTOR)
          var send = card.querySelector(SEND_SELECTOR)
          if (add === null || send === null) return null
          var kids = Array.prototype.slice.call(card.children)
          for (var i = 0; i < kids.length; i++) {
            if (kids[i].contains(add) && kids[i].contains(send)) return kids[i]
          }
          return null
        }

        function findEditorBlock(card, row) {
          var input = card.querySelector('[data-composer-input]')
          if (input === null) return null
          var kids = Array.prototype.slice.call(card.children)
          for (var i = 0; i < kids.length; i++) {
            if (kids[i] === row) continue
            if (kids[i].contains(input)) return kids[i]
          }
          return null
        }

        function findModes(card) {
          var add = card.querySelector(ADD_SELECTOR)
          var node = add === null ? null : add.nextElementSibling
          while (node !== null) {
            if (node.tagName === 'DIV' && node.querySelector('button') !== null) return node
            node = node.nextElementSibling
          }
          return null
        }

        /**
         * 找 hero（新会话首屏）那行的两个控件：工作区选择与 Agent 预设。
         *
         * 它们不是输入卡片的一部分，位置在卡片上方约 28px 的一行里；这里按**几何位置**取，
         * 不依赖 hashed 类名：卡片顶部往上 80px 内、且不在灰字行里的可见按钮。
         */
        function findHeroControls(card, meta) {
          // 只认首屏那一行的两个控件：工作区触发器（aria-label 固定）+ 它同一行的按钮。
          // 早先按「卡片上方 80px 内的按钮」判定，会把消息底部「用量 X tok」按钮一起卷进来
          // （它也在卡片上方），于是被当成首屏控件隐藏掉。
          var ws = document.querySelector("button[aria-label*='选择工作区'], button[aria-label*='workspace']")
          if (ws === null) return []
          var row = ws.parentElement
          if (row === null) return [ws]
          var buttons = row.querySelectorAll('button')
          return buttons.length > 0 ? Array.prototype.slice.call(buttons) : [ws]
        }

        function sync() {
          var card = document.querySelector('[data-composer-card]')
          if (card === null) return false
          var changed = false
          var row = findRow(card)
          var editorBlock = findEditorBlock(card, row)
          var model = card.querySelector(MODEL_SELECTOR)

          if (row !== null && editorBlock !== null && editorBlock.parentElement === card) {
            editorBlock.setAttribute(EDITOR_ATTR, '')
            var tools = row.firstElementChild
            row.insertBefore(editorBlock, tools === null ? row.firstChild : tools.nextSibling)
            changed = true
          }

          var glass = document.querySelector('[' + GLASS_ATTR + ']')
          if (glass === null) {
            glass = document.createElement('div')
            glass.setAttribute(GLASS_ATTR, '')
            if (card.parentElement !== null) card.parentElement.insertBefore(glass, card)
            changed = true
          }
          if (card.parentElement !== glass) { glass.appendChild(card); changed = true }

          var meta = glass.querySelector('[' + META_ATTR + ']')
          if (meta === null) {
            var modes = findModes(card)
            // 搬锚点容器而不是按钮本身：上游的 closeOutside 用 anchorRef.contains(target) 判断
            // 「点是否在触发器内」，把按钮单独搬走会让它判成外部点击（先关后开，看起来收不回去）。
            var modelAnchor = model
            if (model !== null && model.parentElement !== null && model.parentElement.tagName === 'DIV'
                && model.parentElement.parentElement !== null && model.parentElement.parentElement.tagName === 'DIV'
                && model.parentElement.parentElement.parentElement !== card) {
              modelAnchor = model.parentElement
            }
            if (modelAnchor !== null || modes !== null) {
              meta = document.createElement('div')
              meta.setAttribute(META_ATTR, '')
              glass.insertBefore(meta, card)
              if (modes !== null) meta.appendChild(modes)
              if (modelAnchor !== null) meta.appendChild(modelAnchor)
              changed = true
            }
          }

          // hero 首屏：工作区 + Agent 预设 —— 只打标记改样式，**不搬节点**。
          // 搬走会让 React 卸载时找不到自己的节点，导致它们在一轮对话开始后仍然留在屏幕上。
          var heroControls = findHeroControls(card, meta)
          for (var h = 0; h < heroControls.length; h++) {
            if (heroControls[h].getAttribute(HERO_ATTR) === null) {
              heroControls[h].setAttribute(HERO_ATTR, '')
              changed = true
            }
          }
          // 清掉历史误标（例如消息底部的「用量」按钮）
          var marked = document.querySelectorAll('[' + HERO_ATTR + ']')
          for (var m = 0; m < marked.length; m++) {
            if (heroControls.indexOf(marked[m]) === -1) {
              marked[m].removeAttribute(HERO_ATTR)
              changed = true
            }
          }
          var seat = card.closest('[data-composer-seat]')
          var scrollBody = seat === null ? null : seat.parentElement
          if (seat !== null && scrollBody !== null) {
            var first = scrollBody.firstElementChild
            if (first !== null && first !== seat) {
              var heroOn = heroControls.length > 0 || scrollBody.hasAttribute(HERO_PAGE_ATTR)
              if (heroOn && first.getAttribute('data-dsh-hero-content') === null) {
                first.setAttribute('data-dsh-hero-content', '')
                changed = true
              } else if (!heroOn && first.getAttribute('data-dsh-hero-content') !== null) {
                first.removeAttribute('data-dsh-hero-content')
                changed = true
              }
            }
          }
          if (scrollBody !== null) {
            var wantHero = heroControls.length > 0
            if (wantHero !== scrollBody.hasAttribute(HERO_PAGE_ATTR)) {
              if (wantHero) scrollBody.setAttribute(HERO_PAGE_ATTR, '')
              else scrollBody.removeAttribute(HERO_PAGE_ATTR)
              changed = true
            }
          }

          var attachments = card.querySelector('[data-slot="conversation.input.attachments"]')
          var hasAttachment = attachments !== null && attachments.childElementCount > 0
          if (hasAttachment !== glass.hasAttribute(ATTACH_ATTR)) {
            if (hasAttachment) glass.setAttribute(ATTACH_ATTR, '')
            else glass.removeAttribute(ATTACH_ATTR)
            changed = true
          }
          var inputEl = card.querySelector('[data-composer-input]')
          var multiline = inputEl !== null && inputEl.getBoundingClientRect().height > 32
          if (multiline !== glass.hasAttribute(MULTILINE_ATTR)) {
            if (multiline) glass.setAttribute(MULTILINE_ATTR, '')
            else glass.removeAttribute(MULTILINE_ATTR)
            changed = true
          }

          if (card.querySelector(FILE_INPUT_SELECTOR) === null) {
            if (editorBlock !== null && row !== null && editorBlock.parentElement === row) {
              card.insertBefore(editorBlock, card.firstChild)
            }
            return false
          }
          return changed
        }

        /**
         * 粘贴兜底。
         *
         * 上游是 ProseMirror 编辑器，paste 命令里有一句「编辑器没聚焦就直接放弃」；
         * 我们把编辑器块搬进按钮行后，长按唤起系统粘贴时会走到这条放弃分支，
         * 于是剪贴板内容进不来。这里在**气泡阶段**补一手：只有上游没处理
         *（defaultPrevented 仍为 false）时才自己插入，不会重复。
         */
        function bindPasteFallback() {
          var card = document.querySelector('[data-composer-card]')
          if (card === null || card.getAttribute('data-dsh-paste-bound') !== null) return
          card.setAttribute('data-dsh-paste-bound', '')
          card.addEventListener('paste', function (event) {
            if (event.defaultPrevented) return
            var data = event.clipboardData
            var text = data === null || data === undefined ? '' : data.getData('text/plain')
            if (text === '') return
            var input = card.querySelector('[data-composer-input]')
            if (input === null) return
            event.preventDefault()
            input.focus()
            document.execCommand('insertText', false, text)
          })
        }

        var observer = null
        function apply() {
          if (typeof document === 'undefined') return
          injectStyle()
          sync()
          bindPasteFallback()
          if (observer !== null) return
          observer = new MutationObserver(function () { sync() })
          observer.observe(document.documentElement, { childList: true, subtree: true })
        }

        exports.apply = apply
        exports.sync = sync
        return module.exports
      },
    })
  } catch (err) {
    console.warn('[dsh-composer-glass] client runtime error:', err)
  }
})()
