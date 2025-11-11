FROM nginx:1.27-alpine
COPY reverse-proxy/locations /etc/nginx/locations
COPY reverse-proxy/nginx.conf /etc/nginx/nginx.conf
COPY reverse-proxy/www /var/www
COPY reverse-proxy/docker-entrypoint.d /docker-entrypoint.d
COPY reverse-proxy/templates /etc/nginx/templates
COPY reverse-proxy/shared /etc/nginx/shared
