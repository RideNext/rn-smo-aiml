import json
import threading
import time
import logging
from kafka import KafkaConsumer
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PMDataConsumer:
    def __init__(self, bootstrap_servers="localhost:9092", topic="pmreports"):
        self.bootstrap_servers = bootstrap_servers
        self.topic = topic
        self.running = False
        self.latest_data = {}
        self.callbacks = []
        self.thread = None

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self._consume_loop)
        self.thread.daemon = True
        self.thread.start()
        logger.info(f"Started PM Data Consumer on topic {self.topic}")

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join()

    def add_callback(self, callback):
        self.callbacks.append(callback)

    def _consume_loop(self):
        # Try to connect to Kafka, if fails, switch to mock mode
        try:
            consumer = KafkaConsumer(
                self.topic,
                bootstrap_servers=self.bootstrap_servers,
                value_deserializer=lambda x: json.loads(x.decode('utf-8')),
                auto_offset_reset='earliest',  # Read from beginning to get existing messages
                group_id='ui-visualization-group',
                session_timeout_ms=10000,
                request_timeout_ms=15000,
                reconnect_backoff_max_ms=2000,
                consumer_timeout_ms=5000  # Timeout after 5 seconds of no messages
            )
            logger.info("Connected to Kafka")
            
            message_received = False
            while self.running:
                try:
                    for message in consumer:
                        message_received = True
                        data = message.value
                        self._process_message(data)
                except Exception as e:
                    if "timeout" in str(e).lower() or not message_received:
                        logger.warning(f"No messages from Kafka topic {self.topic}, switching to MOCK DATA MODE")
                        break
                    logger.error(f"Kafka error: {e}")
                    break
                    
        except Exception as e:
            logger.warning(f"Failed to connect to Kafka: {e}")
            logger.info("Switching to MOCK DATA MODE for demo purposes")
        
        if not self.running:
            return
            
        # MOCK DATA MODE
        logger.info("Generating mock data for 15 cells across 5 gNBs")
        self._generate_mock_data()

    def _generate_mock_data(self):
        import random
        
        # Generate 5 gNBs with 3 cells each
        cells = []
        for gnb_idx in range(1, 6):
            for cell_idx in range(1, 4):
                base_util = random.choice([15, 45, 75]) # Randomize base utilization profile
                cells.append({
                    "cell_id": f"ManagedElement=o-du-{gnb_idx},GNBDUFunction=1,NRCellDU={cell_idx}",
                    "base_util": base_util,
                    "global_cell_id": f"460-01-{gnb_idx:05d}-{cell_idx:02d}",
                    "sector_id": f"Sector {cell_idx}",
                    "pci": random.randint(1, 500)
                })
        
        logger.info(f"Generating mock data for {len(cells)} cells across 5 gNBs")
        
        while self.running:
            # Update all cells in each cycle
            current_batch = []
            for cell in cells:
                # Add random fluctuation
                utilization = cell["base_util"] + random.uniform(-15, 15)
                
                # Occasionally spike or drop significantly to trigger state changes
                if random.random() < 0.05:
                    utilization = random.uniform(0, 100)
                    
                utilization = max(0, min(100, utilization))
                
                data = {
                    "cell_id": cell["cell_id"],
                    "global_cell_id": cell["global_cell_id"],
                    "sector_id": cell["sector_id"],
                    "pci": cell["pci"],
                    "utilization": utilization,
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S")
                }
                self._process_message(data)
                current_batch.append(data)
            
            # Sleep a bit less to make it look busier
            time.sleep(1.0)

    def _process_message(self, data):
        # Extract relevant fields
        try:
            cell_id = data.get("cell_id")
            utilization = data.get("utilization")
            timestamp = data.get("timestamp")
            
            if cell_id is None or utilization is None:
                return

            # Determine action and reason
            action = "NO ACTION"
            action_color = "gray"
            reason = "Utilization within optimal range (20% - 70%)"
            
            if utilization < 20:
                action = "SWITCH OFF"
                action_color = "red"
                reason = f"Low traffic detected ({utilization:.1f}% < 20%). Power saving enabled."
            elif utilization > 70:
                action = "SWITCH ON"
                action_color = "green"
                reason = f"High congestion detected ({utilization:.1f}% > 70%). Capacity increased."

            processed_data = {
                "cell_id": cell_id,
                "global_cell_id": data.get("global_cell_id", "N/A"),
                "sector_id": data.get("sector_id", "N/A"),
                "pci": data.get("pci", "N/A"),
                "utilization": utilization,
                "timestamp": timestamp,
                "action": action,
                "action_color": action_color,
                "reason": reason
            }

            # Update latest state
            self.latest_data[cell_id] = processed_data

            # Notify callbacks
            for callback in self.callbacks:
                try:
                    # If callback is async, schedule it
                    if asyncio.iscoroutinefunction(callback):
                        asyncio.run(callback(processed_data))
                    else:
                        callback(processed_data)
                except Exception as e:
                    logger.error(f"Error in callback: {e}")

        except Exception as e:
            logger.error(f"Error processing message: {e}")
