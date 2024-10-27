FROM node:19-alpine
RUN apk add curl
WORKDIR /app
COPY package*.json ./
COPY ./ ./
RUN npm ci
# RUN npm run build
CMD ["npm", "run", "dev"]
