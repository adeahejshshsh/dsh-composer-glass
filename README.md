# dsh-composer-glass

DSH（DeepSeek Harness）外置插件：改造会话页底栏（composer）与**新会话首屏**的排版。

全部规则按**结构定位**（`data-*` 属性、`aria-label`、类名后缀），不依赖上游 hashed 类名，上游换哈希前缀也不受影响。

## 功能

### 底栏

1. **输入框落在「＋」与「发送」之间**
   上游把编辑器块单独放在按钮行上方，所以输入框永远在上一行。插件把编辑器块搬进按钮行，行内改为单行布局。
2. **权限 / 模型提到输入框上方一行**
   从卡片里移出权限选择器与模型选择器，作为 12px 灰字放在输入上方：权限靠左（右移 14px），模型靠右。
3. **细长药丸**
   输入区默认 `border-radius: 999px` 的细长药丸；出现附件或输入多行时自动切回 22px 圆角矩形。
4. **对齐修正**
   - 占位文字 `top: 4px → 0`（上游会让它比输入框低 4px）
   - 发送键 `transform: none`（上游带 `translateY(-2px)`，会高 2px）
   - 行内 `gap: 0`、编辑器块与内部容器吃满宽度（否则右侧留白）
5. **模型名过长时保留思考强度**
   上游给思维强度（Effort）写了 `flex-shrink: 1000`，名字一长先压扁它。插件改为：名称可收缩并省略号，Effort 永不收缩。
6. **模型选择：展开时才高亮**
   触屏 `:hover` 会粘住，导致关闭菜单后文字下方仍有深色底。插件把 hover 压平，只在 `[aria-expanded="true"]` 时铺上游同款底色。
7. **菜单锚点完整**
   搬运的是模型选择器的**锚点容器**而不是按钮本身，保证上游 `anchorRef.contains(target)` 判定仍成立（否则会出现「再点一次收不回来」）。
8. **粘贴兜底**
   编辑器被搬进按钮行后，长按粘贴可能走到上游「编辑器未聚焦 → 放弃」的分支。插件在气泡阶段补一手，仅当上游未处理（`defaultPrevented === false`）时插入文本。
9. **输入区渐变**
   座位 `margin-top/padding-top` 成对扩展，把上游 36px 的渐变压成 84px 且上移，淡化区域覆盖到灰字行之上（不新增图层）。
10. **每条回复的「用量 X tok」**
    上游在 `@media (width <= 480px)` 里把该文字隐藏成图标，插件恢复文字显示。

### 新会话首屏

11. 工作区选择与 Agent 预设：**只改样式，不搬节点**（搬走会让 React 卸载不到，导致常驻残留）。
12. 标题「探索未至之境」在输入区上方空白里垂直居中，输入区仍贴底。
13. 首屏那两个控件可选隐藏，见下文「可调项」。

## 安装

插件是**外置**的，不改动上游包。把它放进 DSH 的 incoming 目录并登记到 profile：

```bash
# 1) 放到工作区插件目录
git clone https://github.com/adeahejshshsh/dsh-composer-glass.git \
  ~/.dsh/workspaces/incoming/dsh-composer-glass

# 2) 软链到 profile 的 node_modules
PROFILE=~/.dsh/profiles/web
ln -sfn ../../../workspaces/incoming/dsh-composer-glass \
  "$PROFILE/node_modules/dsh-composer-glass"

# 3) 登记依赖与 bundle（编辑 $PROFILE/package.json）
#    dependencies 增加： "dsh-composer-glass": "link:<绝对路径>"
#    dsh.profile.bundles 数组追加： "dsh-composer-glass"
```

重启 DSH 引擎后生效。

## 卸载

从 `dsh.profile.bundles` 移除 `dsh-composer-glass`，删除 `dependencies` 里的条目与 `node_modules` 里的软链，重启引擎。上游界面即恢复原样。

## 可调项

`client.js` 里所有样式集中在 `injectStyle()` 的字符串数组中，常用调整点：

| 想改什么 | 改哪里 |
| --- | --- |
| 灰字行与输入框间距 | `[data-dsh-composer-glass]` 的 `gap`（默认 4px） |
| 药丸圆角 / 高度 | `[data-dsh-composer-card]` 的 `border-radius` / `min-height` |
| 发送键尺寸 | `button[aria-label*="发送"]` 的 `width/height`（默认 30px） |
| 输入区渐变长度 | `[data-composer-seat]` 的 `margin-top`/`padding-top`/渐变终点 |
| 首屏隐藏工作区与 Agent 预设 | `[data-dsh-hero-control]` 的 `display`（默认 `none`） |
| 权限选择器右移量 | `[data-dsh-composer-top] > :first-child` 的 `margin-left`（默认 14px） |

## 兼容性

- 面向 DSH Web 客户端（`dsh.client.platform: web`，`immediately: true`），无宿主逻辑。
- 规则使用 `[class*="_suffix"]` 匹配上游 CSS Modules 类名后缀，上游重命名内部类名时需要跟着调整。
- 结构性选择器依赖：`[data-composer-card]`、`[data-composer-input]`、`[data-composer-placeholder]`、`[data-composer-seat]`、`[data-slot="conversation.input.attachments"]`、`[aria-label*="选择工作区"]`。

## License

MIT
