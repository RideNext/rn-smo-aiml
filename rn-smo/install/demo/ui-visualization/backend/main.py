from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import asyncio
import json
import logging
import os
import httpx
import threading
from consumer import PMDataConsumer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Energy rApp Visualization API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for demo purposes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Kafka Configuration
KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "localhost:9092")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "rapp-topic")
consumer = PMDataConsumer(bootstrap_servers=KAFKA_BOOTSTRAP, topic=KAFKA_TOPIC)

# ICS Configuration
ICS_BASE_URL = os.getenv("ICS_BASE_URL", "http://informationservice:8083")

# Policy Management Service Configuration
POLICY_BASE_URL = os.getenv("POLICY_BASE_URL", "http://policymanagementservice:8081")


# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending to websocket: {e}")
                # We might want to remove dead connections here, but disconnect handles it usually

manager = ConnectionManager()

# Initialize consumer
consumer = PMDataConsumer(
    bootstrap_servers=KAFKA_BOOTSTRAP,
    topic=KAFKA_TOPIC
)

# Global queue for websocket broadcasting
message_queue = asyncio.Queue()
main_loop = None  # Store reference to main event loop

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global main_loop
    main_loop = asyncio.get_event_loop()  # Get main loop reference
    
    logger.info("Application starting up...")
    
    # Register callback for Kafka messages
    def kafka_update_callback(data):
        """Called by Kafka consumer thread when new data arrives"""
        try:
            if main_loop and not main_loop.is_closed():
                # Use the stored main loop reference
                asyncio.run_coroutine_threadsafe(
                    message_queue.put(data),
                    main_loop
                )
        except Exception as e:
            logger.error(f"Error in kafka callback: {e}")
    
    consumer.add_callback(kafka_update_callback)
    logger.info("Kafka callback registered")
    
    # Start Kafka consumer
    consumer.start()
    logger.info("Kafka consumer started")
    
    # Start broadcast worker
    asyncio.create_task(broadcast_worker())
    logger.info("Broadcast worker started - event-driven mode")
    
    # Start periodic sync worker (every 10 seconds)
    asyncio.create_task(periodic_sync_worker())
    logger.info("Periodic sync worker started")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down...")
    consumer.stop()

async def broadcast_worker():
    """Event-driven worker that broadcasts updates when they arrive"""
    logger.info("Broadcast worker started - event-driven mode")
    
    while True:
        try:
            # Wait for new data from Kafka (event-driven, no polling!)
            data = await message_queue.get()
            
            # Broadcast the single cell update to all connected clients
            await manager.broadcast({
                "type": "update",
                "data": [data]  # Send as list for consistency with frontend
            })
            
            # Also send full snapshot every 10 seconds for sync
            # (This ensures clients stay in sync even if they miss updates)
        except Exception as e:
            logger.error(f"Error in broadcast worker: {e}")
            await asyncio.sleep(0.1)  # Brief pause on error
    
# Background task for periodic full state sync
async def periodic_sync_worker():
    """Send full state every 10 seconds to ensure sync"""
    while True:
        await asyncio.sleep(10)
        if consumer.latest_data:
            await manager.broadcast({
                "type": "sync",
                "data": list(consumer.latest_data.values())
            })


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial state
        if consumer.latest_data:
            await websocket.send_json({
                "type": "init",
                "data": list(consumer.latest_data.values())
            })
            
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@app.get("/health")
async def health():
    return {"status": "ok", "kafka_connected": consumer.running}

@app.get("/api/ics/producers")
async def get_ics_producers():
    """Fetch information producers from ICS with full details"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Get list of producer IDs
            response = await client.get(f"{ICS_BASE_URL}/data-producer/v1/info-producers")
            response.raise_for_status()
            producer_ids = response.json()
            
            logger.info(f"Found {len(producer_ids)} producers: {producer_ids}")
            
            # Fetch details for each producer
            producers = []
            for producer_id in producer_ids:
                try:
                    detail_response = await client.get(f"{ICS_BASE_URL}/data-producer/v1/info-producers/{producer_id}")
                    detail_response.raise_for_status()
                    producer_detail = detail_response.json()
                    producer_detail['info_producer_id'] = producer_id
                    producers.append(producer_detail)
                except Exception as e:
                    logger.error(f"Error fetching producer {producer_id}: {str(e)}")
            
            return producers
    except Exception as e:
        logger.error(f"Error fetching ICS producers: {str(e)}")
        return []

@app.get("/api/ics/consumers")
async def get_ics_consumers():
    """Fetch information consumers (jobs) from ICS with full details"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Get list of job IDs
            response = await client.get(f"{ICS_BASE_URL}/data-consumer/v1/info-jobs")
            response.raise_for_status()
            job_ids = response.json()
            
            logger.info(f"Found {len(job_ids)} jobs: {job_ids}")
            
            # Fetch details for each job
            jobs = []
            for job_id in job_ids:
                try:
                    detail_response = await client.get(f"{ICS_BASE_URL}/data-consumer/v1/info-jobs/{job_id}")
                    detail_response.raise_for_status()
                    job_detail = detail_response.json()
                    job_detail['info_job_identity'] = job_id
                    jobs.append(job_detail)
                except Exception as e:
                    logger.error(f"Error fetching job {job_id}: {str(e)}")
            
            return jobs
    except Exception as e:
        logger.error(f"Error fetching ICS consumers: {str(e)}")
        return []

@app.get("/api/policy/types")
async def get_policy_types():
    """Fetch policy types from Policy Management Service"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{POLICY_BASE_URL}/a1-policy/v2/policy-types")
            response.raise_for_status()
            data = response.json()
            type_ids = data.get('policytype_ids', []) if isinstance(data, dict) else data
            
            logger.info(f"Found {len(type_ids)} policy types: {type_ids}")
            
            # Fetch details for each policy type
            types = []
            for type_id in type_ids:
                try:
                    detail_response = await client.get(f"{POLICY_BASE_URL}/a1-policy/v2/policy-types/{type_id}")
                    detail_response.raise_for_status()
                    type_detail = detail_response.json()
                    type_detail['policytype_id'] = type_id
                    types.append(type_detail)
                except Exception as e:
                    logger.error(f"Error fetching policy type {type_id}: {str(e)}")
            
            return types
    except Exception as e:
        logger.error(f"Error fetching policy types: {str(e)}")
        return []

@app.get("/api/policy/rics")
async def get_rics():
    """Fetch RICs from Policy Management Service"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{POLICY_BASE_URL}/a1-policy/v2/rics")
            response.raise_for_status()
            data = response.json()
            return data.get('rics', []) if isinstance(data, dict) else data
    except Exception as e:
        logger.error(f"Error fetching RICs: {str(e)}")
        return []

@app.get("/api/policy/policies")
async def get_policies():
    """Fetch all policies from Policy Management Service"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{POLICY_BASE_URL}/a1-policy/v2/policies")
            response.raise_for_status()
            data = response.json()
            policy_ids = data.get('policy_ids', []) if isinstance(data, dict) else data
            
            policies = []
            for policy_id in policy_ids:
                try:
                    detail_response = await client.get(f"{POLICY_BASE_URL}/a1-policy/v2/policies/{policy_id}")
                    detail_response.raise_for_status()
                    policies.append(detail_response.json())
                except Exception as e:
                    logger.error(f"Error fetching policy {policy_id}: {str(e)}")
            
            return policies
    except Exception as e:
        logger.error(f"Error fetching policies: {str(e)}")
        return []

@app.post("/api/policy/policies")
async def create_policy(policy: dict):
    """Create a new policy"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Prepare policy data - ensure policyData is already parsed if it's a string
            policy_data_raw = policy.get("policyData", {})
            if isinstance(policy_data_raw, str):
                try:
                    policy_data_parsed = json.loads(policy_data_raw)
                except json.JSONDecodeError:
                    return JSONResponse(
                        status_code=400,
                        content={"status": "error", "message": "Invalid JSON in policyData field"}
                    )
            else:
                policy_data_parsed = policy_data_raw
            
            policy_payload = {
                "policy_id": policy.get("policyId"),
                "policytype_id": policy.get("policyTypeId"),
                "ric_id": policy.get("ric"),
                "service_id": policy.get("service"),
                "policy_data": policy_data_parsed
            }
            
            logger.info(f"Creating policy: {policy_payload['policy_id']} for RIC: {policy_payload['ric_id']}")
            
            response = await client.put(
                f"{POLICY_BASE_URL}/a1-policy/v2/policies",
                json=policy_payload
            )
            response.raise_for_status()
            
            logger.info(f"Policy {policy_payload['policy_id']} created successfully")
            return {
                "status": "success",
                "message": f"Policy {policy_payload['policy_id']} created and pushed to Near RT RIC {policy_payload['ric_id']}",
                "policy_id": policy_payload['policy_id']
            }
    except httpx.HTTPStatusError as e:
        error_detail = f"A1 PMS returned error: {e.response.status_code} - {e.response.text}"
        logger.error(f"Error creating policy: {error_detail}")
        return JSONResponse(
            status_code=e.response.status_code,
            content={"status": "error", "message": error_detail}
        )
    except Exception as e:
        logger.error(f"Error creating policy: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Internal error: {str(e)}"}
        )

@app.delete("/api/policy/policies/{policy_id}")
async def delete_policy(policy_id: str):
    """Delete a policy"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.delete(f"{POLICY_BASE_URL}/a1-policy/v2/policies/{policy_id}")
            response.raise_for_status()
            return {"status": "success"}
    except Exception as e:
        logger.error(f"Error deleting policy: {str(e)}")
        return {"status": "error", "message": str(e)}

