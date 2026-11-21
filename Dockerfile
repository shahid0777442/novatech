# The CI pipeline builds dist/ first, then packages exactly that output.
FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app
COPY dist/ ./

# Run as the unprivileged user that ships with the node image.
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "src/server.js"]
