FROM node:22-alpine

WORKDIR /app
RUN apk add --no-cache rclone
COPY server/index.mjs ./index.mjs

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "index.mjs"]
