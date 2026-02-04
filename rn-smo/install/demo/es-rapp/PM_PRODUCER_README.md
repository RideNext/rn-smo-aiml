# PM Data Producer Demo

This script generates simulated PM data and sends it to the Kafka `pmreports` topic to demonstrate the Energy Saving rApp consuming and processing the data.

## Features

- Simulates 3 cells with different utilization patterns:
  - **Cell 1**: Low utilization (~15%) → Triggers SWITCH OFF
  - **Cell 2**: High utilization (~75%) → Triggers SWITCH ON  
  - **Cell 3**: Medium utilization (~45%) → No action
- Sends PM reports in O-RAN format
- Adds random variation to make it realistic
- Shows expected rApp actions

## Prerequisites

```bash
pip install kafka-python
```

## Running from Outside Kubernetes

### Option 1: Port Forward Kafka
```bash
# Terminal 1: Port forward Kafka
kubectl port-forward -n ridenext-nonrt kafka-1-kafka-0 9092:9092

# Terminal 2: Run producer (update script to use localhost:9092)
python3 pm_data_producer.py
```

### Option 2: Run Inside Kubernetes

```bash
# Copy script to kafka-client pod
kubectl cp pm_data_producer.py ridenext-nonrt/kafka-client:/tmp/

# Install kafka-python
kubectl exec -n ridenext-nonrt kafka-client -- pip install kafka-python

# Run the producer
kubectl exec -it -n ridenext-nonrt kafka-client -- python3 /tmp/pm_data_producer.py
```

## Demo Steps

### 1. Start the Producer
```bash
kubectl exec -it -n ridenext-nonrt kafka-client -- python3 /tmp/pm_data_producer.py
```

**Expected Output**:
```
PM Data Producer for Energy Saving rApp Demo
================================================================================
Kafka Bootstrap: kafka-1-kafka-bootstrap.ridenext-nonrt:9092
Topic: pmreports
Cells: 3
================================================================================
✓ Connected to Kafka

Starting PM data generation...
Watch the Energy Saving rApp logs to see it consume and process this data!

[0001] NRCellDU=1           | Util:  18.3% | 🔴 SWITCH OFF
[0002] NRCellDU=2           | Util:  72.1% | 🟢 SWITCH ON
[0003] NRCellDU=1           | Util:  43.5% | ⚪ NO ACTION
```

### 2. Watch Energy Saving rApp Logs
```bash
# In another terminal
kubectl logs -f -n ridenext-nonrt -l app=simple-energy-rapp
```

**Expected Output**:
```
📊 Cell ManagedElement=o-du-1,GNBDUFunction=1,NRCellDU=1: Utilization 18.3%
🔴 Cell ManagedElement=o-du-1,GNBDUFunction=1,NRCellDU=1: Low utilization (18.3%) - Recommending SWITCH OFF
✓ Successfully sent A1 policy: energy_save_NRCellDU_1_1700412300 (switch_off)

📊 Cell ManagedElement=o-du-1,GNBDUFunction=1,NRCellDU=2: Utilization 72.1%
🟢 Cell ManagedElement=o-du-1,GNBDUFunction=1,NRCellDU=2: High utilization (72.1%) - Recommending SWITCH ON
✓ Successfully sent A1 policy: energy_save_NRCellDU_2_1700412305 (switch_on)
```

### 3. Verify End-to-End Flow

```bash
# Check Kafka messages
kubectl exec -n ridenext-nonrt kafka-client -- \
  kafka-console-consumer --bootstrap-server kafka-1-kafka-bootstrap.ridenext-nonrt:9092 \
  --topic pmreports --from-beginning --max-messages 5

# Check rApp is consuming
kubectl exec -n ridenext-nonrt kafka-client -- \
  kafka-consumer-groups --bootstrap-server kafka-1-kafka-bootstrap.ridenext-nonrt:9092 \
  --describe --group pm-rapp-energy-saving-energy-saving-rapp
```

## What to Observe

1. **Producer Output**: Shows PM data being sent with utilization percentages
2. **rApp Logs**: Shows:
   - PM data consumption
   - Utilization calculations
   - Energy saving decisions (🔴 OFF, 🟢 ON, ⚪ NO ACTION)
   - A1 policy generation
3. **Kafka Consumer Group**: Shows lag and offset progression

## Customization

Edit the `CELLS` configuration in the script:

```python
CELLS = [
    {"cell_id": "YourCell1", "base_util": 10},   # Very low
    {"cell_id": "YourCell2", "base_util": 85},   # Very high
    {"cell_id": "YourCell3", "base_util": 50},   # Medium
]
```

## Stopping

Press `Ctrl+C` in the producer terminal to stop gracefully.
