#!/bin/bash

echo "Starting rApp Manager Backend on port 8081..."

cd /home/bluefox/Manish/performance/rappmanager/rapp-manager-application

# Start with custom port
java -jar target/rapp-manager-application-*.jar --server.port=8081

# Or with Maven:
# mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8081
