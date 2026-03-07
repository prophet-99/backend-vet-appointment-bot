FROM node:22-alpine

WORKDIR /api

ARG DATABASE_URL=postgresql://dummy
ENV DATABASE_URL=$DATABASE_URL

COPY package*.json .
RUN npm ci

COPY . .

RUN npm run prisma:generate
RUN npm run build
RUN npm prune --omit=dev

EXPOSE 3000

CMD ["npm","start"]
