# 高项 2027 练习平台

React + Vite + TypeScript 练习平台，包含：

- 12 个章节、600 道四选一题，答题后立即显示解析；
- 本地错题本：错题自动收录，重新答对即移除；
- 八大绩效域独立置顶，另含 40 道专项练习；
- 每章论文范围、采分点和练笔动作；
- 计算、案例、ITTO、论文、记忆与冲刺专题。

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

## 数据与隐私

题目随应用构建发布。答题进度和错题本仅保存到浏览器 `localStorage`，没有账号、数据库或远程个人数据存储；清除浏览器站点数据即可删除学习记录。

## 部署

Cloudflare Pages 项目：`gaoxiang-2027-practice`。

```bash
npm run deploy
```

部署脚本构建 `dist` 后用 Wrangler 上传至 Pages。生产地址：<https://gaoxiang-2027-practice.pages.dev/>。
