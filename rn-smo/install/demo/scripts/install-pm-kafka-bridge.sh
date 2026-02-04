#!/bin/bash

#  ============LICENSE_START===============================================
#  Copyright (C) 2023 Nordix Foundation. All rights reserved.
#  ========================================================================
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#  ============LICENSE_END=================================================
#

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "${ROOT_DIR}"

. scripts/helper-scripts/kube_get_controlplane_host.sh
. scripts/helper-scripts/create_ics_job.sh
. scripts/helper-scripts/create_topic.sh

# Generic error printout function
# args: <numeric-response-code> <descriptive-string>
check_error() {
    if [ $1 -ne 0 ]; then
        echo "Failed: $2"
        echo "Exiting..."
        exit 1
    fi
}

export KUBERNETESHOST=$(kube_get_controlplane_host)
if [ $? -ne 0 ]; then
    echo $KUBERNETESHOST
    echo "Exiting"
    exit 1
fi

echo "Kubernetes control plane host: $KUBERNETESHOST"

echo "Installation pm kafka bridge job - rapp-topic to pmreports"

# Ensure pmreports topic exists
echo "Creating pmreports topic if it doesn't exist"
create_topic kafka-1-kafka-bootstrap.ridenext-nonrt:9092 pmreports 10

. scripts/helper-scripts/populate_keycloak.sh

# Get client token for API access
cid="console-setup"
TOKEN=$(get_client_token nonrtric-realm $cid)

# Create ICS job that consumes from rapp-topic and produces to pmreports
# This bridges the gap between pm-producer output and pmlog input
JOB='{"info_type_id": "json-file-data-from-filestore",
     "job_owner": "console",
     "status_notification_uri": "http://callback.ridenext-nonrt:80/post",
     "job_definition": {
        "deliveryInfo": {
           "topic": "pmreports",
           "bootStrapServers": "kafka-1-kafka-bootstrap.ridenext-nonrt:9092"
        },
        "filter": {
           "sourceNames": [],
           "measurementTypes": []
        }
     }}'

echo "Creating ICS job for kafka bridge: rapp-topic -> pmreports"
echo $JOB > .job.json
create_ics_job kp-kafka-bridge 0 $TOKEN

echo "PM Kafka bridge job installation completed"
