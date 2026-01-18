"""
Coordinator Process (robust, atomic updates per peer)

Responsibilities:
1. Enable peers for training.
2. Send TRAIN commands with hyperparameters and dataset info.
3. Collect per-epoch training results and heartbeats incrementally.
4. Track when each peer completes.
5. Send STOP commands to all peers after training.
6. Update MongoDB: peer statuses, user statuses, and nested final results.
"""

import asyncio
import json
import os
import ssl
from datetime import datetime
from bson import ObjectId
import urllib.parse

import aio_pika
from pymongo import MongoClient
import certifi
from dotenv import load_dotenv

# ----------------------------
# Load environment variables
# ----------------------------
load_dotenv()

MONGO_USERNAME = os.getenv("MONGO_USERNAME")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD")
MONGO_CLUSTER = os.getenv("MONGO_CLUSTER")
MONGO_DB = os.getenv("MONGO_DB", "hypertuneai")

if not all([MONGO_USERNAME, MONGO_PASSWORD, MONGO_CLUSTER]):
    raise RuntimeError("MongoDB env vars missing")

username = urllib.parse.quote_plus(MONGO_USERNAME)
password = urllib.parse.quote_plus(MONGO_PASSWORD)

mongo_uri = f"mongodb+srv://{username}:{password}@{MONGO_CLUSTER}/{MONGO_DB}?retryWrites=true&w=majority"

mongo_client = MongoClient(
    mongo_uri,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=5000,
)

db = mongo_client[MONGO_DB]
sessions_collection = db["sessions"]
users_collection = db["users"]

# ----------------------------
# RabbitMQ helpers
# ----------------------------
async def connect_rabbitmq():
    rabbit_url = os.getenv("RABBITMQ_URL")
    if not rabbit_url:
        raise RuntimeError("RABBITMQ_URL not configured")

    ssl_ctx = ssl.create_default_context()
    ssl_ctx.load_verify_locations("isrgrootx1.pem")

    connection = await aio_pika.connect_robust(rabbit_url, ssl_context=ssl_ctx)
    channel = await connection.channel()
    await channel.set_qos(prefetch_count=1)
    return connection, channel

async def publish_command(channel, queue_name: str, payload):
    if isinstance(payload, dict):
        body = json.dumps(payload).encode()
    else:
        body = str(payload).encode()
    await channel.default_exchange.publish(
        aio_pika.Message(body=body),
        routing_key=queue_name,
    )

async def start_event_consumer(channel, queue_name: str, event_queue: asyncio.Queue):
    """
    Consume messages from peers and push them to an asyncio.Queue.
    """
    queue = await channel.declare_queue(queue_name, durable=True)

    async def on_message(message: aio_pika.IncomingMessage):
        async with message.process():
            raw = message.body.decode()
            try:
                payload = json.loads(raw)
            except Exception:
                payload = raw
            event_queue.put_nowait(payload)

    await queue.consume(on_message)
    print(f"[coordinator] consuming {queue_name}", flush=True)

# ----------------------------
# Event handler
# ----------------------------
async def handle_events(event_queue: asyncio.Queue, session_oid, peers, coordinator_uid):
    total_peers = len(peers)
    completed_peers = set()

    # Optional in-memory buffer for batch writes
    peer_buffers = {peer['uid']: [] for peer in peers}
    BATCH_INTERVAL = 1.0  # seconds
    last_batch_time = asyncio.get_event_loop().time()

    while True:
        try:
            event = await asyncio.wait_for(event_queue.get(), timeout=0.5)
        except asyncio.TimeoutError:
            event = None

        now = asyncio.get_event_loop().time()

        # ----------------------------
        # Batch flush
        # ----------------------------
        if now - last_batch_time >= BATCH_INTERVAL:
            for uid, batch in peer_buffers.items():
                if batch:
                    # Atomic append using arrayFilters
                    sessions_collection.update_one(
                        {"_id": session_oid},
                        {"$push": {"peers.$[peer].results": {"$each": batch}}},
                        array_filters=[{"peer.uid": uid}]
                    )
                    peer_buffers[uid] = []
            last_batch_time = now

        if not event:
            # Check exit condition even if no events
            if len(completed_peers) == total_peers:
                break
            continue

        if not isinstance(event, dict):
            print(f"[coordinator:{coordinator_uid}] raw event: {event}", flush=True)
            continue

        peer_uid = event.get("peer_uid")
        if not peer_uid:
            continue

        # ----------------------------
        # EPOCH HEARTBEAT
        # ----------------------------
        if "epoch" in event:
            epoch_result = {
                "epoch": event["epoch"],
                "loss": event["loss"],
                "accuracy": event["accuracy"],
                "timestamp": datetime.utcnow(),
            }
            peer_buffers[peer_uid].append(epoch_result)

            # Global aggregation
            sessions_collection.update_one(
                {"_id": session_oid},
                {"$push": {f"results.{peer_uid}": {"$each": [epoch_result]}}}
            )

            print(
                f"[coordinator:{coordinator_uid}] "
                f"{peer_uid} epoch {event['epoch']} "
                f"loss={event['loss']:.4f} acc={event['accuracy']:.4f}",
                flush=True,
            )

        # ----------------------------
        # IDLE HEARTBEAT
        # ----------------------------
        elif event.get("status") == "idle":
            print(f"[coordinator:{coordinator_uid}] {peer_uid} idle", flush=True)

        # ----------------------------
        # COMPLETION
        # ----------------------------
        elif event.get("type") == "DONE" and event.get("status") == "completed":
            # Flush remaining buffer for this peer
            batch = peer_buffers.get(peer_uid, [])
            if batch:
                sessions_collection.update_one(
                    {"_id": session_oid},
                    {"$push": {"peers.$[peer].results": {"$each": batch}}},
                    array_filters=[{"peer.uid": peer_uid}]
                )
                peer_buffers[peer_uid] = []

            completed_peers.add(peer_uid)

            # Update peer and user status
            sessions_collection.update_one(
                {"_id": session_oid, "peers.uid": peer_uid},
                {"$set": {"peers.$.status": "OFFLINE"}}
            )

            users_collection.update_one(
                {"_id": ObjectId(peer_uid)},
                {"$set": {"status": "OFFLINE"}}
            )

            print(
                f"[coordinator:{coordinator_uid}] "
                f"{peer_uid} completed ({len(completed_peers)}/{total_peers})",
                flush=True,
            )

    # Final flush for any remaining buffered epochs
    for uid, batch in peer_buffers.items():
        if batch:
            sessions_collection.update_one(
                {"_id": session_oid},
                {"$push": {"peers.$[peer].results": {"$each": batch}}},
                array_filters=[{"peer.uid": uid}]
            )
    return completed_peers

# ----------------------------
# Main coordinator logic
# ----------------------------
"""
Coordinator Process (robust, atomic updates per peer)

Responsibilities:
1. Enable peers for training.
2. Send TRAIN commands with hyperparameters and dataset info.
3. Collect per-epoch training results and heartbeats incrementally.
4. Track when each peer completes.
5. Send STOP commands to all peers after training.
6. Update MongoDB: peer statuses, user statuses, and nested final results.
"""

import asyncio
import json
import os
import ssl
from datetime import datetime
from bson import ObjectId
import urllib.parse

import aio_pika
from pymongo import MongoClient
import certifi
from dotenv import load_dotenv

# ----------------------------
# Load environment variables
# ----------------------------
load_dotenv()

MONGO_USERNAME = os.getenv("MONGO_USERNAME")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD")
MONGO_CLUSTER = os.getenv("MONGO_CLUSTER")
MONGO_DB = os.getenv("MONGO_DB", "hypertuneai")

if not all([MONGO_USERNAME, MONGO_PASSWORD, MONGO_CLUSTER]):
    raise RuntimeError("MongoDB env vars missing")

username = urllib.parse.quote_plus(MONGO_USERNAME)
password = urllib.parse.quote_plus(MONGO_PASSWORD)

mongo_uri = f"mongodb+srv://{username}:{password}@{MONGO_CLUSTER}/{MONGO_DB}?retryWrites=true&w=majority"

mongo_client = MongoClient(
    mongo_uri,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=5000,
)

db = mongo_client[MONGO_DB]
sessions_collection = db["sessions"]
users_collection = db["users"]

# ----------------------------
# RabbitMQ helpers
# ----------------------------
async def connect_rabbitmq():
    rabbit_url = os.getenv("RABBITMQ_URL")
    if not rabbit_url:
        raise RuntimeError("RABBITMQ_URL not configured")

    ssl_ctx = ssl.create_default_context()
    ssl_ctx.load_verify_locations("isrgrootx1.pem")

    connection = await aio_pika.connect_robust(rabbit_url, ssl_context=ssl_ctx)
    channel = await connection.channel()
    await channel.set_qos(prefetch_count=1)
    return connection, channel

async def publish_command(channel, queue_name: str, payload):
    if isinstance(payload, dict):
        body = json.dumps(payload).encode()
    else:
        body = str(payload).encode()
    await channel.default_exchange.publish(
        aio_pika.Message(body=body),
        routing_key=queue_name,
    )

async def start_event_consumer(channel, queue_name: str, event_queue: asyncio.Queue):
    """
    Consume messages from peers and push them to an asyncio.Queue.
    """
    queue = await channel.declare_queue(queue_name, durable=True)

    async def on_message(message: aio_pika.IncomingMessage):
        async with message.process():
            raw = message.body.decode()
            try:
                payload = json.loads(raw)
            except Exception:
                payload = raw
            event_queue.put_nowait(payload)

    await queue.consume(on_message)
    print(f"[coordinator] consuming {queue_name}", flush=True)

# ----------------------------
# Event handler
# ----------------------------
async def handle_events(event_queue: asyncio.Queue, session_oid, peers, coordinator_uid):
    total_peers = len(peers)
    completed_peers = set()

    # Optional in-memory buffer for batch writes
    peer_buffers = {peer['uid']: [] for peer in peers}
    BATCH_INTERVAL = 1.0  # seconds
    last_batch_time = asyncio.get_event_loop().time()

    while True:
        try:
            event = await asyncio.wait_for(event_queue.get(), timeout=0.5)
        except asyncio.TimeoutError:
            event = None

        now = asyncio.get_event_loop().time()

        # ----------------------------
        # Batch flush
        # ----------------------------
        if now - last_batch_time >= BATCH_INTERVAL:
            for uid, batch in peer_buffers.items():
                if batch:
                    # Atomic append using arrayFilters
                    sessions_collection.update_one(
                        {"_id": session_oid},
                        {"$push": {"peers.$[peer].results": {"$each": batch}}},
                        array_filters=[{"peer.uid": uid}]
                    )
                    peer_buffers[uid] = []
            last_batch_time = now

        if not event:
            # Check exit condition even if no events
            if len(completed_peers) == total_peers:
                break
            continue

        if not isinstance(event, dict):
            print(f"[coordinator:{coordinator_uid}] raw event: {event}", flush=True)
            continue

        peer_uid = event.get("peer_uid")
        if not peer_uid:
            continue

        # ----------------------------
        # EPOCH HEARTBEAT
        # ----------------------------
        if "epoch" in event:
            epoch_result = {
                "epoch": event["epoch"],
                "loss": event["loss"],
                "accuracy": event["accuracy"],
                "timestamp": datetime.utcnow(),
            }
            peer_buffers[peer_uid].append(epoch_result)

            # Global aggregation
            sessions_collection.update_one(
                {"_id": session_oid},
                {"$push": {f"results.{peer_uid}": {"$each": [epoch_result]}}}
            )

            print(
                f"[coordinator:{coordinator_uid}] "
                f"{peer_uid} epoch {event['epoch']} "
                f"loss={event['loss']:.4f} acc={event['accuracy']:.4f}",
                flush=True,
            )

        # ----------------------------
        # IDLE HEARTBEAT
        # ----------------------------
        elif event.get("status") == "idle":
            print(f"[coordinator:{coordinator_uid}] {peer_uid} idle", flush=True)

        # ----------------------------
        # COMPLETION
        # ----------------------------
        elif event.get("type") == "DONE" and event.get("status") == "completed":
            # Flush remaining buffer for this peer
            batch = peer_buffers.get(peer_uid, [])
            if batch:
                sessions_collection.update_one(
                    {"_id": session_oid},
                    {"$push": {"peers.$[peer].results": {"$each": batch}}},
                    array_filters=[{"peer.uid": peer_uid}]
                )
                peer_buffers[peer_uid] = []

            completed_peers.add(peer_uid)

            # Update peer and user status
            sessions_collection.update_one(
                {"_id": session_oid, "peers.uid": peer_uid},
                {"$set": {"peers.$.status": "OFFLINE"}}
            )

            users_collection.update_one(
                {"_id": ObjectId(peer_uid)},
                {"$set": {"status": "OFFLINE"}}
            )

            print(
                f"[coordinator:{coordinator_uid}] "
                f"{peer_uid} completed ({len(completed_peers)}/{total_peers})",
                flush=True,
            )

    # Final flush for any remaining buffered epochs
    for uid, batch in peer_buffers.items():
        if batch:
            sessions_collection.update_one(
                {"_id": session_oid},
                {"$push": {"peers.$[peer].results": {"$each": batch}}},
                array_filters=[{"peer.uid": uid}]
            )
    return completed_peers

# ----------------------------
# Main coordinator logic
# ----------------------------
async def coordinator_main(session_uid: str, coordinator_uid: str):
    print(f"[coordinator:{coordinator_uid}] starting for session {session_uid}", flush=True)

    # ----------------------------
    # Load session
    # ----------------------------
    session_oid = ObjectId(session_uid)
    session = sessions_collection.find_one({"_id": session_oid})
    if not session:
        raise RuntimeError("Session not found")

    peers = session.get("peers", [])
    if not peers:
        raise RuntimeError("Session has no peers")

    hyperparams_list = session.get("hyperparameters", [])
    if len(hyperparams_list) < len(peers):
        raise RuntimeError("Not enough hyperparameter configs for peers")

    # ----------------------------
    # Shared dataset info
    # ----------------------------
    dataset_info = session.get("dataset", {})
    csv_link = f"s3://{dataset_info.get('s3_bucket')}/{dataset_info.get('s3_key')}"
    x_labels = [col for col in dataset_info.get("columns", []) if col != "label"]
    y_label = "label"

    # ----------------------------
    # RabbitMQ setup
    # ----------------------------
    connection, channel = await connect_rabbitmq()
    coordinator_queue = f"coordinator.{coordinator_uid}.events"
    event_queue = asyncio.Queue()

    await start_event_consumer(channel, coordinator_queue, event_queue)

    try:
        # ----------------------------
        # ENABLE peers
        # ----------------------------
        for peer in peers:
            await publish_command(
                channel,
                peer["peer_queue"],
                {
                    "type": "ENABLE",
                    "queue": coordinator_queue,
                    "coordinator_uid": coordinator_uid,
                },
            )

        print(f"[coordinator:{coordinator_uid}] peers enabled", flush=True)
        await asyncio.sleep(2)

        # ----------------------------
        # FIX #2 — TRAIN with index-based hyperparams
        # ----------------------------
        for idx, peer in enumerate(peers):
            hyperparams = hyperparams_list[idx]

            train_payload = {
                "type": "TRAIN",
                "csv_link": csv_link,
                "x_labels": x_labels,
                "y_label": y_label,
                "hyperparameters": hyperparams,

                "peer_uid": peer["uid"],
                "coordinator_uid": coordinator_uid,
            }

            await publish_command(channel, peer["peer_queue"], train_payload)

        print(
            f"[coordinator:{coordinator_uid}] training started (unique hyperparams per peer)",
            flush=True,
        )

        # ----------------------------
        # Handle events
        # ----------------------------
        await handle_events(event_queue, session_oid, peers, coordinator_uid)

        # ----------------------------
        # STOP peers
        # ----------------------------
        for peer in peers:
            await publish_command(channel, peer["peer_queue"], {"type": "STOP"})

        print(f"[coordinator:{coordinator_uid}] STOP sent to all peers", flush=True)

        # ----------------------------
        # FIX #3 — Save results PER peer hyperparams
        # ----------------------------
        final_results = {}

        for idx, peer in enumerate(peers):
            hyperparams = hyperparams_list[idx]

            peer_doc = sessions_collection.find_one(
                {"_id": session_oid},
                {"peers": {"$elemMatch": {"uid": peer["uid"]}}},
            )

            peer_results = (
                peer_doc.get("peers", [])[0].get("results", [])
                if peer_doc and peer_doc.get("peers")
                else []
            )

            final_results[peer["uid"]] = {
                "hyperparameters": hyperparams,
                "results": peer_results,
            }

        sessions_collection.update_one(
            {"_id": session_oid},
            {
                "$set": {
                    "status": "COMPLETED",
                    "completed_at": datetime.utcnow(),
                    "coordinator_uid": coordinator_uid,
                    "final_results": final_results,
                }
            },
        )

        users_collection.update_one(
            {"_id": ObjectId(coordinator_uid)},
            {"$set": {"status": "OFFLINE"}},
        )

        print(f"[coordinator:{coordinator_uid}] session COMPLETED", flush=True)

    finally:
        await channel.close()
        await connection.close()

        print(f"[coordinator:{coordinator_uid}] RabbitMQ connection closed", flush=True)

        # Clean shutdown
        pending = [t for t in asyncio.all_tasks() if t is not asyncio.current_task()]
        for task in pending:
            task.cancel()
        await asyncio.gather(*pending, return_exceptions=True)

# ----------------------------
# Multiprocessing entrypoint
# ----------------------------
def run_coordinator(session_uid: str, coordinator_uid: str):
    """
    Entrypoint for Process(target=run_coordinator, args=(session_uid, coordinator_uid))
    """
    asyncio.run(coordinator_main(session_uid, coordinator_uid))


# ----------------------------
# Multiprocessing entrypoint
# ----------------------------
def run_coordinator(session_uid: str, coordinator_uid: str):
    """
    Entrypoint for Process(target=run_coordinator, args=(session_uid, coordinator_uid))
    """
    asyncio.run(coordinator_main(session_uid, coordinator_uid))
