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

# Script to obtain the ip/host-name of kubernetes control plance
# args: -

kube_get_controlplane_host() {
    __current_context=$(kubectl config current-context)
    if [ $? -ne 0 ]; then
        echo "Cannot list kubernetes current context"
        return 1
    fi
    __cluster_name=$(kubectl config view -o "jsonpath={.contexts[?(@.name=='"$__current_context"')].context.cluster}")
    if [ $? -ne 0 ]; then
        echo "Cannot find the cluster name in kubernetes current context"
        return 1
    fi
    __cluster_server=$(kubectl config view -o "jsonpath={.clusters[?(@.name=='"$__cluster_name"')].cluster.server}")
    if [ $? -ne 0 ]; then
        echo "Cannot find the server name in kubernetes current context"
        return 1
    fi
    __cluster_host=$(echo $__cluster_server | awk -F[/:] '{print $4}')
    if [ $? -ne 0 ]; then
        echo "Cannot host from kubernetes current context"
        return 1
    fi
    
    # Special handling for Kind clusters - get actual container IP instead of 127.0.0.1
    if [[ "$__cluster_host" == "127.0.0.1" ]] && kubectl config current-context | grep -q "kind-"; then
        __kind_cluster_name=$(kubectl config current-context | sed 's/kind-//')
        __kind_container_name="${__kind_cluster_name}-control-plane"
        __kind_ip=$(docker inspect "$__kind_container_name" --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null)
        if [ ! -z "$__kind_ip" ]; then
            echo $__kind_ip
            return 0
        fi
    fi
    
    echo $__cluster_host
    return 0
}