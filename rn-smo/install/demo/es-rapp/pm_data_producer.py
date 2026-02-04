#!/usr/bin/env python3
"""
PM Data Producer - Sends test PM data to Kafka topic
Simulates PM reports with varying cell utilization to trigger energy saving decisions
"""

import json
import time
import random
from datetime import datetime
from kafka import KafkaProducer

import os

# Configuration
KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "kafka-1-kafka-bootstrap.ridenext-nonrt:9092")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "rapp-topic")

# Cell configurations with sector, PCI, and Global Cell ID information
CELLS = [
    {
        "cell_id": "ManagedElement=o-du-1,GNBDUFunction=1,NRCellDU=1", 
        "base_util": 15,  # Low utilization
        "sector_id": "Sector 1",
        "pci": 100,
        "global_cell_id": "460-01-00001-01"
    },
    {
        "cell_id": "ManagedElement=o-du-1,GNBDUFunction=1,NRCellDU=2", 
        "base_util": 75,  # High utilization
        "sector_id": "Sector 2",
        "pci": 101,
        "global_cell_id": "460-01-00001-02"
    },
    {
        "cell_id": "ManagedElement=o-du-2,GNBDUFunction=1,NRCellDU=1", 
        "base_util": 45,  # Medium utilization
        "sector_id": "Sector 1",
        "pci": 200,
        "global_cell_id": "460-01-00002-01"
    },
]

def create_pm_message(cell_id, utilization, sector_id=None, pci=None, global_cell_id=None):
    """Create a PM data message in O-RAN format"""
    timestamp = datetime.now().isoformat()
    
    # Calculate PRB values based on utilization
    # Assume 100 PRBs available
    prb_used_dl = int(utilization)
    prb_used_ul = int(utilization * 0.8)  # UL typically lower than DL
    
    # Calculate throughput (simplified)
    throughput_dl = prb_used_dl * 1000000  # 1 Mbps per PRB
    throughput_ul = prb_used_ul * 800000   # 0.8 Mbps per PRB
    
    pm_message = {
        "event": {
            "commonEventHeader": {
                "domain": "measurement",
                "eventId": f"pm-{cell_id}-{int(time.time())}",
                "eventName": "Measurement_RAN",
                "lastEpochMicrosec": int(time.time() * 1000000),
                "priority": "Normal",
                "reportingEntityName": "o-du-simulator",
                "sequence": 0,
                "sourceName": cell_id,
                "startEpochMicrosec": int(time.time() * 1000000),
                "version": "4.0.1"
            },
            "measurementFields": {
                "measurementFieldsVersion": "4.0",
                "measurementInterval": 60,
                "additionalMeasurements": [
                    {
                        "name": "RAN_Measurements",
                        "hashMap": {
                            "pmRadioPrbUsedDl": str(prb_used_dl),
                            "pmRadioPrbUsedUl": str(prb_used_ul),
                            "pmRadioThpVolDl": str(throughput_dl),
                            "pmRadioThpVolUl": str(throughput_ul),
                            "pmRadioPrbAvailDl": "100",
                            "pmRadioPrbAvailUl": "100"
                        }
                    }
                ]
            }
        },
        "measObjLdn": cell_id,
        "cell_id": cell_id,
        "timestamp": timestamp,
        "utilization": utilization
    }
    
    # Add sector, PCI, and global cell ID if provided
    if sector_id:
        pm_message["sector_id"] = sector_id
    if pci:
        pm_message["pci"] = pci
    if global_cell_id:
        pm_message["global_cell_id"] = global_cell_id
    
    return pm_message

def main():
    print("=" * 80)
    print("PM Data Producer for Energy Saving rApp Demo")
    print("=" * 80)
    print(f"Kafka Bootstrap: {KAFKA_BOOTSTRAP}")
    print(f"Topic: {KAFKA_TOPIC}")
    print(f"Cells: {len(CELLS)}")
    print("=" * 80)
    
    # Create Kafka producer
    try:
        producer = KafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            acks='all'
        )
        print("✓ Connected to Kafka")
    except Exception as e:
        print(f"✗ Failed to connect to Kafka: {e}")
        return
    
    print("\nStarting PM data generation...")
    print("Watch the Energy Saving rApp logs to see it consume and process this data!")
    print("\nPress Ctrl+C to stop\n")
    
    message_count = 0
    try:
        while True:
            for cell_config in CELLS:
                cell_id = cell_config["cell_id"]
                base_util = cell_config["base_util"]
                sector_id = cell_config.get("sector_id")
                pci = cell_config.get("pci")
                global_cell_id = cell_config.get("global_cell_id")
                
                # Add some random variation (±10%)
                utilization = base_util + random.uniform(-10, 10)
                utilization = max(0, min(100, utilization))  # Clamp to 0-100
                
                # Create and send PM message with sector and PCI details
                pm_message = create_pm_message(
                    cell_id, 
                    utilization, 
                    sector_id=sector_id, 
                    pci=pci, 
                    global_cell_id=global_cell_id
                )
                
                future = producer.send(KAFKA_TOPIC, value=pm_message)
                result = future.get(timeout=10)
                
                message_count += 1
                
                # Determine expected action
                if utilization < 20:
                    action = "🔴 SWITCH OFF"
                elif utilization > 70:
                    action = "🟢 SWITCH ON"
                else:
                    action = "⚪ NO ACTION"
                
                print(f"[{message_count:04d}] {cell_id.split(',')[-1]:20s} | "
                      f"Sector: {sector_id or 'N/A':10s} | PCI: {pci or 'N/A':>3} | "
                      f"Util: {utilization:5.1f}% | {action}")
                
                time.sleep(2)  # 2 seconds between messages
            
            print()  # Blank line after each round
            
    except KeyboardInterrupt:
        print(f"\n\nStopping... Sent {message_count} messages total")
    except Exception as e:
        print(f"\nError: {e}")
    finally:
        producer.close()
        print("✓ Producer closed")

if __name__ == "__main__":
    main()
