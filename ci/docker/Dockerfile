FROM mcr.microsoft.com/playwright:v1.52.0-jammy

WORKDIR /workspace/e2e

COPY package.json package-lock.json* ./
RUN npm ci && npx playwright install --with-deps chromium

COPY . .

ENV CI=true
ENV E2E_HEADLESS=true

CMD ["npm", "run", "test:smoke"]
