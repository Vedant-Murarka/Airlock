FROM python:3.11-slim

# Create a non-root user (important for safety)
RUN useradd -m -u 1000 sandbox

# Set working directory inside container
WORKDIR /sandbox

# Run everything as non-root
USER sandbox