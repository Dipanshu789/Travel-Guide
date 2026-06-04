FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy service code
COPY . /app/ml-service

# Note: The Docker-compose file will mount the root directory to access the model files
# Or we could copy them directly, but for now we expect them in /app (root)
# So we need to ensure the working directory structure matches what main.py expects.
# main.py expects models to be in its parent directory.

# Run FastAPI using uvicorn
CMD ["uvicorn", "ml-service.main:app", "--host", "0.0.0.0", "--port", "8000"]
