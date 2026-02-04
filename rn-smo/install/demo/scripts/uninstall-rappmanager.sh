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

NAMESPACE="ridenext-nonrt"

echo "Uninstalling rApp Manager..."

# Uninstall helm release
helm uninstall rappmanager -n ${NAMESPACE} 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✓ rApp Manager uninstalled successfully"
else
    echo "⚠ rApp Manager was not installed or already removed"
fi

# Clean up PVC if it exists
kubectl delete pvc rappmanager-pvc -n ${NAMESPACE} 2>/dev/null

echo "✓ rApp Manager cleanup complete"
