from multiprocessing import Process, Queue

# user_id -> { process, control_queue, rabbit_queue }
workers: dict[str, dict] = {}
