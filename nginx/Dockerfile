FROM nginx:1.25-alpine

# Remove the default Nginx configuration to avoid conflicts
RUN rm /etc/nginx/conf.d/default.conf
# Copy our custom configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy static SSL configuration files
COPY ssl /etc/nginx/ssl