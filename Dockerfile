





# Use Playwright's base image
FROM mcr.microsoft.com/playwright:v1.49.0-jammy

# Set working directory
WORKDIR /work

# Install required tools
RUN apt-get update && apt-get install -y curl xz-utils

# Download and install Node.js v20.19.3
RUN curl -fsSL https://nodejs.org/dist/v20.19.3/node-v20.19.3-linux-x64.tar.xz \
    -o node.tar.xz && \
    tar -xf node.tar.xz -C /usr/local --strip-components=1 && \
    rm node.tar.xz

# Verify installation
RUN node -v && npm -v

# Copy the necessary files to the container
COPY package.json package.json


# Set the entry point command
CMD ["/bin/bash", "-c", "echo 'Must run with Visual Test Runner: `npm run test:visual -- -- --ci`'"]
