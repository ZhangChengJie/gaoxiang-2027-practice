# 高项 2027 练习平台

React + TypeScript + Vite 构建的移动优先练习平台，**微信小程序风格 UI**。

## 功能

- **17 个主题、405 道选择题**：覆盖高项核心知识领域，答题后立即显示解析
- **10 大专项训练**：
  - 绩效域专项 · 计算题专项 · 法律法规专项
  - ITTO 高频链路 · 案例分析 · 记忆与复盘
  - **易错考点**（动态提取高频错题）
  - **综合模考**（随机 75 题）
  - 六周冲刺 · **2026 真题相似专项**
- **错题本**：自动收录错题，记录错误次数和时间，按章节分组，练习正确自动移除
- **论文范围**：每章完整论文范围、采分点、练笔动作、关键词
- **微信小程序风格 UI**：白底绿主色、底部 Tab 导航、移动端优先

## 本地运行

```bash
npm install
npm run dev
```

运行检查：

```bash
npm run test
npm run build
```

## 技术栈

- React 19 + TypeScript 6
- React Router v7
- Vite 8 + Vitest
- localStorage（无后端）
- Cloudflare Pages

## 部署

```bash
npm run deploy
```

生产地址：<https://gaoxiang-2027-practice.pages.dev/>
