#!/usr/bin/env python3
"""
Energy Saving rApp with ICS Integration
Registers as consumer with Information Coordinator Service and receives job assignments
"""

import os
import time
import json
import logging
import requests
from kafka import KafkaConsumer
from datetime import datetime
import signal
import sys

# Configuration
ICS_URL = os.getenv("ICS_URL", "http://informationservice.ridenext-nonrt:8083")
RAPP_ID = os.getenv("RAPP_ID", "energy-saving-rapp")
RAPP_NAMESPACE = os.getenv("RAPP_NAMESPACE", "ridenext-nonrt")

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "kafka-1-kafka-bootstrap.ridenext-nonrt:9092")
POLICY_MGMT_URL = os.getenv("POLICY_MGMT_URL", "http://policymanagementservice.ridenext-nonrt:8081")
RIC_ID = os.getenv("RIC_ID", "ric1")

# Energy saving thresholds
LOW_UTIL_THRESHOLD = float(os.getenv("LOW_UTIL_THRESHOLD", "20.0"))
HIGH_UTIL_THRESHOLD = float(os.getenv("HIGH_UTIL_THRESHOLD", "70.0"))

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class EnergySavingRApp:
    def __init__(self):
        self.consumer = None
        self.cell_states = {}
        self.job_id = None
        self.kafka_topic = None
        self.running = True
        
        # Register signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self.shutdown)
        signal.signal(signal.SIGTERM, self.shutdown)
        
    def shutdown(self, signum, frame):
        """Graceful shutdown handler"""
        logger.info(f"\nReceived signal {signum}, shutting down gracefully...")
        self.running = False
        self.deregister_from_ics()
        if self.consumer:
            self.consumer.close()
        sys.exit(0)
    
    def register_with_ics(self):
        """Register as data consumer with Information Coordinator Service"""
        self.job_id = f"rapp-job-pm-energy-saving-{RAPP_ID}"
        
        # Job definition matching PM rApp pattern
        job_definition = {
            "info_type_id": "PmData",
            "job_owner": RAPP_ID,
            "job_definition": {
                "filter": {
                    "sourceNames": [],
                    "measObjInstIds": [],
                    "measTypeSpecs": [
                        {
                            "measuredObjClass": "NRCellDU",
                            "measTypes": ["pmRadioPrbUsedDl", "pmRadioPrbUsedUl", "pmRadioThpVolDl", "pmRadioThpVolUl"]
                        }
                    ]
                },
                "deliveryInfo": {
                    "topic": f"rapp-topic",
                    "bootStrapServers": KAFKA_BOOTSTRAP
                }
            },
            "job_result_uri": f"http://{RAPP_ID}.{RAPP_NAMESPACE}:8080/stats",
            "status_notification_uri": f"http://{RAPP_ID}.{RAPP_NAMESPACE}:8080/status"
        }
        
        try:
            url = f"{ICS_URL}/data-consumer/v1/info-jobs/{self.job_id}"
            response = requests.put(url, json=job_definition, timeout=10)
            
            if response.status_code in [200, 201]:
                logger.info(f"[SUCCESS] Successfully registered job with ICS: {self.job_id}")
                self.kafka_topic = job_definition["job_definition"]["deliveryInfo"]["topic"]
                return True
            else:
                logger.error(f"[ERROR] Failed to register with ICS: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"[ERROR] Error registering with ICS: {e}")
            return False
    
    def deregister_from_ics(self):
        """Deregister from Information Coordinator Service"""
        if not self.job_id:
            return
            
        try:
            url = f"{ICS_URL}/data-consumer/v1/info-jobs/{self.job_id}"
            response = requests.delete(url, timeout=10)
            
            if response.status_code in [200, 204]:
                logger.info(f"[SUCCESS] Successfully deregistered job from ICS: {self.job_id}")
            else:
                logger.warning(f"[WARNING] Failed to deregister from ICS: {response.status_code}")
                
        except Exception as e:
            logger.error(f"[ERROR] Error deregistering from ICS: {e}")
    
    def connect_kafka(self):
        """Connect to Kafka using topic from ICS job"""
        if not self.kafka_topic:
            logger.error("No Kafka topic assigned from ICS job")
            return False
            
        try:
            group_id = f"pm-rapp-energy-saving-{RAPP_ID}"
            
            self.consumer = KafkaConsumer(
                self.kafka_topic,
                bootstrap_servers=KAFKA_BOOTSTRAP,
                group_id=group_id,
                auto_offset_reset='latest',
                enable_auto_commit=True,
                value_deserializer=lambda m: json.loads(m.decode('utf-8'))
            )
            logger.info(f"[SUCCESS] Connected to Kafka at {KAFKA_BOOTSTRAP}")
            logger.info(f"[SUCCESS] Subscribed to topic: {self.kafka_topic} (from ICS job)")
            logger.info(f"[SUCCESS] Consumer group: {group_id}")
            return True
            
        except Exception as e:
            logger.error(f"[ERROR] Failed to connect to Kafka: {e}")
            return False
    
    def process_pm_message(self, message):
        """Process PM data message from Kafka"""
        try:
            pm_data = message.value
            
            # Extract cell ID and metrics
            if isinstance(pm_data, dict):
                cell_id = pm_data.get('measObjLdn', pm_data.get('cell_id', 'unknown'))
                
                # Calculate utilization from PM counters
                utilization = self.calculate_utilization(pm_data)
                
                if utilization is not None:
                    logger.info(f"[DATA] Cell {cell_id}: Utilization {utilization:.1f}%")
                    
                    # Make energy saving decision
                    action = self.make_energy_decision(cell_id, utilization)
                    
                    if action:
                        self.send_a1_policy(cell_id, action, utilization)
                        
        except Exception as e:
            logger.error(f"Error processing PM message: {e}")
    
    def calculate_utilization(self, pm_data):
        """Calculate PRB utilization from PM data"""
        try:
            # Look for PRB utilization metrics
            if 'measValues' in pm_data:
                for meas in pm_data['measValues']:
                    if 'measResults' in meas:
                        for result in meas['measResults']:
                            if 'pmRadioPrbUsedDl' in str(result):
                                used = result.get('value', 0)
                                return min((used / 100) * 100, 100)
            
            # Fallback: generate random utilization for demo
            import random
            return random.uniform(10, 90)
            
        except Exception as e:
            logger.debug(f"Error calculating utilization: {e}")
            return None
    
    def make_energy_decision(self, cell_id, utilization):
        """Decide whether to turn cell on or off based on utilization"""
        current_state = self.cell_states.get(cell_id, "on")
        
        if utilization < LOW_UTIL_THRESHOLD and current_state == "on":
            logger.info(f"[LOW] Cell {cell_id}: Low utilization ({utilization:.1f}%) - Recommending SWITCH OFF")
            return "switch_off"
        elif utilization > HIGH_UTIL_THRESHOLD and current_state == "off":
            logger.info(f"[HIGH] Cell {cell_id}: High utilization ({utilization:.1f}%) - Recommending SWITCH ON")
            return "switch_on"
        else:
            logger.debug(f"[OK] Cell {cell_id}: Utilization {utilization:.1f}% - No action needed (state: {current_state})")
            return None
    
    def send_a1_policy(self, cell_id, action, utilization):
        """Send A1 policy to Policy Management Service"""
        policy_id = f"energy_save_{cell_id.replace('/', '_').replace('=', '_')}_{int(time.time())}"
        
        policy = {
            "policy_id": policy_id,
            "policytype_id": "2",
            "ric_id": RIC_ID,
            "service_id": RAPP_ID,
            "policy_data": {
                "cell_id": cell_id,
                "action": action,
                "reason": "traffic_based_energy_saving",
                "utilization": round(utilization, 2),
                "threshold": LOW_UTIL_THRESHOLD if action == "switch_off" else HIGH_UTIL_THRESHOLD,
                "timestamp": datetime.now().isoformat()
            }
        }
        
        try:
            url = f"{POLICY_MGMT_URL}/a1-policy/v2/policies"
            logger.info(f"[SEND] Sending policy JSON to {url}:")
            logger.info(json.dumps(policy, indent=2))
            response = requests.put(url, json=policy, timeout=10)
            
            if response.status_code in [200, 201]:
                logger.info(f"[SUCCESS] Successfully sent A1 policy: {policy_id} ({action})")
                self.cell_states[cell_id] = "off" if action == "switch_off" else "on"
                return True
            else:
                logger.warning(f"[WARNING] Policy service returned {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.ConnectionError:
            logger.warning(f"[WARNING] Policy Management Service not available at {POLICY_MGMT_URL}")
            return False
        except Exception as e:
            logger.error(f"[ERROR] Error sending A1 policy: {e}")
            return False
    
    def run(self):
        """Main loop"""
        logger.info("=" * 80)
        logger.info("Energy Saving rApp Started (ICS Integration Mode)")
        logger.info(f"rApp ID: {RAPP_ID}")
        logger.info(f"ICS URL: {ICS_URL}")
        logger.info(f"Kafka Bootstrap: {KAFKA_BOOTSTRAP}")
        logger.info(f"Policy Management: {POLICY_MGMT_URL}")
        logger.info(f"Low Utilization Threshold: {LOW_UTIL_THRESHOLD}%")
        logger.info(f"High Utilization Threshold: {HIGH_UTIL_THRESHOLD}%")
        logger.info("=" * 80)
        
        # Step 1: Register with ICS
        logger.info("\n[STEP 1] Registering with Information Coordinator Service...")
        if not self.register_with_ics():
            logger.error("Failed to register with ICS, retrying in 10 seconds...")
            time.sleep(10)
            return self.run()
        
        # Step 2: Connect to Kafka
        logger.info("\n[STEP 2] Connecting to Kafka...")
        if not self.connect_kafka():
            logger.error("Failed to connect to Kafka, retrying in 10 seconds...")
            time.sleep(10)
            return self.run()
        
        # Step 3: Consume messages
        logger.info("\n[STEP 3] Starting message consumption...")
        logger.info("Waiting for PM data from Kafka...\n")
        
        message_count = 0
        try:
            for message in self.consumer:
                if not self.running:
                    break
                    
                message_count += 1
                logger.debug(f"Received message #{message_count}")
                self.process_pm_message(message)
                
        except KeyboardInterrupt:
            logger.info("\nShutting down Energy Saving rApp...")
        except Exception as e:
            logger.error(f"Error in main loop: {e}")
        finally:
            self.deregister_from_ics()
            if self.consumer:
                self.consumer.close()


if __name__ == "__main__":
    rapp = EnergySavingRApp()
    rapp.run()
