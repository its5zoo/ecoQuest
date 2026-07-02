FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:stable-alpine

# Set worker_processes to 1 to prevent OOM crashes on high-core cloud hosts
RUN sed -i 's/worker_processes.*/worker_processes 1;/g' /etc/nginx/nginx.conf

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
