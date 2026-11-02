FROM node:24-alpine
# Sharp uses these fonts for Arabic and English captions in exported QR images.
RUN apk add --no-cache font-dejavu
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
COPY --chown=node:node . .
USER node
EXPOSE 3200
CMD ["node", "QRCode_Server.js"]
