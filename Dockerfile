# ---- Stage 1: build the client ----
FROM node:20-alpine AS client
WORKDIR /app
COPY client/package*.json client/
COPY shared/ shared/
RUN npm --prefix client ci
COPY client/ client/
ARG VITE_UMAMI_WEBSITE_ID
ENV VITE_UMAMI_WEBSITE_ID=$VITE_UMAMI_WEBSITE_ID
RUN npm --prefix client run build

# ---- Stage 2: runtime (server serves API + built client) ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY server/package*.json server/
RUN npm --prefix server ci --omit=dev
COPY server/ server/
COPY shared/ shared/
COPY --from=client /app/client/dist client/dist
ENV CLIENT_DIST=/app/client/dist
ENV PORT=3001
EXPOSE 3001
CMD ["npm", "--prefix", "server", "start"]
