FROM node:16-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
ENV DOCKER_HOST=127.0.0.1
EXPOSE 3000 8000 1935
CMD ["npm", "start"]