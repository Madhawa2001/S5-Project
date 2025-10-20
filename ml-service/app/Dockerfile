# Use a Python 3.13 image based on Debian's slim distribution
FROM python:3.13-slim-bookworm

# Set up environment variables for non-interactive commands
ENV DEBIAN_FRONTEND=noninteractive

# 1. CRITICAL FIX: Install the missing system library (libatomic1)
# This library provides 'libatomic.so.1', which is needed by Prisma's bundled Node.js binaries.
# We also install build-essential for any C dependencies your Python packages might have.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    libatomic1 \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file first to leverage Docker caching
COPY requirements.txt /app/
# Install Python dependencies into the virtual environment path
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code
COPY . /app

# 2. Fetch Prisma binaries during the build (now that libatomic1 is installed)
# This downloads the Query Engine executable.
RUN prisma py fetch

# 3. CRITICAL ADDITION: Generate the Python client code
# This command generates the client files needed by your application (e.g., the 'db' object).
RUN prisma py generate

# Expose the default port for Uvicorn
EXPOSE 8000

# Command to run your FastAPI application using Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
