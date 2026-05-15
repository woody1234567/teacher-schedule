# 建立建置階段
FROM node:22-alpine AS builder

# 啟用 pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN corepack prepare pnpm@10.32.1 --activate

WORKDIR /app

# 複製 package.json 和 pnpm-lock.yaml 以便安裝依賴
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 複製專案原始碼並進行建置
COPY . .
RUN pnpm run build

# 建立執行階段
FROM node:22-alpine

WORKDIR /app

# 僅複製建置後的檔案 (.output) 以及必要的設定檔
COPY --from=builder /app/.output ./.output

# 暴露對外 Port
EXPOSE 3000

# 啟動 Nitro 伺服器
CMD ["node", ".output/server/index.mjs"]
