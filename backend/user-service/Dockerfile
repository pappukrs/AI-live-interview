FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json ./
RUN npm install --production
RUN npm install -g prisma@6
COPY . .
RUN npx prisma generate
EXPOSE 4001
CMD ["sh", "-c", "npx prisma db push && npm start"]
