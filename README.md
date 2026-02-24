# SumMerge Puzzle

一个基于数学求和的消除益智游戏。

## 部署到 Vercel 指南

按照以下步骤将此项目部署到你的 Vercel 账户：

### 第一步：同步到 GitHub
1. 在 GitHub 上创建一个新的仓库（例如 `summerge-puzzle`）。
2. 在本地项目根目录下运行以下命令（如果你在本地开发）：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/summerge-puzzle.git
   git push -u origin main
   ```

### 第二步：部署到 Vercel
1. 登录 [Vercel 控制台](https://vercel.com)。
2. 点击 **"Add New..."** -> **"Project"**。
3. 导入你刚刚创建的 GitHub 仓库。
4. Vercel 会自动识别这是一个 Vite 项目：
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 点击 **"Deploy"**。

### 环境变量（可选）
如果你在项目中使用了 Gemini AI 功能，请在 Vercel 项目设置的 **Environment Variables** 中添加：
- `GEMINI_API_KEY`: 你的 Google AI SDK 密钥。

## 开发
```bash
npm install
npm run dev
```
