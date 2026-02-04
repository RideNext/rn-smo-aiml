#!/bin/bash

#  ============LICENSE_START===============================================
#  Copyright (C) 2024 OpenInfra Foundation Europe. All rights reserved.
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

NAMESPACE=onap
RELEASE=onap

echo "Uninstalling onap-policy ..."

# Uninstall helm release

if helm list -n "$NAMESPACE" | grep -q "^$RELEASE"; then
    echo "ONAP Helm release '$RELEASE' found. Deleting..."
    helm uninstall "$RELEASE" -n "$NAMESPACE"
else
    echo "ONAP Helm release '$RELEASE' not found. Nothing to delete."
fi


