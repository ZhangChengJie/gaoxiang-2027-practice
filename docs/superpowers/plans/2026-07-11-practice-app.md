# 高项练习平台 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建并部署带错题本、章节论文范围和绩效域专题的高项 React 练习平台。

**Architecture:** Vite 在构建时将本地题库/文档转换为类型化数据；React 路由承载学习页，localStorage 持久化学习状态；Cloudflare Pages 托管 `dist`。

**Tech Stack:** React 19、Vite、TypeScript、React Router、Vitest、Cloudflare Pages/Wrangler。

---

### Task 1: 初始化框架与数据导入

**Files:** `package.json`, `vite.config.ts`, `src/data/*`, `src/lib/*`

- [ ] 初始化 Vite React TypeScript 项目并安装路由、测试和 Wrangler。
- [ ] 解析 12 个 Markdown 题库为类型化题目数据；将章节与论文范围定义为独立数据。
- [ ] 为 localStorage 状态写入版本化读取/回退测试。

### Task 2: 实现学习与错题功能

**Files:** `src/App.tsx`, `src/pages/*`, `src/components/*`

- [ ] 实现首页、章节训练、错题本与专题路由。
- [ ] 答题后显示解析；错误加入错题本，答对错题后移除。
- [ ] 展示章节进度和本地隐私说明。

### Task 3: 绩效域与论文范围

**Files:** `src/data/performanceDomains.ts`, `src/data/essays.ts`, `src/pages/TopicsPage.tsx`

- [ ] 添加八大绩效域说明、40 道专项题和独立筛选入口。
- [ ] 为每个章节提供论文范围、采分点和练笔动作。

### Task 4: 验证、发布与部署

**Files:** `wrangler.jsonc`, `README.md`, `.github/workflows/*`

- [ ] 通过 typecheck、test、build 和预览验证。
- [ ] 初始化 Git、提交、创建 GitHub 仓库并推送。
- [ ] 用 Wrangler 部署 Pages，记录最终 URL。
