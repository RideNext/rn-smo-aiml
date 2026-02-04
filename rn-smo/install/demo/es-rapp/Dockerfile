FROM python:3.10-slim

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir \
    kafka-python==2.0.2 \
    requests==2.31.0

# Copy application
COPY energy_saving_rapp.py /app/

# Run the application
CMD ["python", "-u", "energy_saving_rapp.py"]
