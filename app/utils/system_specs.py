import platform
import psutil
import os

def get_system_specs():
    return {
        "os": platform.system(),
        "os_version": platform.version(),
        "architecture": platform.machine(),
        "cpu": {
            "physical_cores": psutil.cpu_count(logical=False),
            "logical_cores": psutil.cpu_count(logical=True),
            "max_frequency_mhz": psutil.cpu_freq().max if psutil.cpu_freq() else None,
        },
        "memory": {
            "total_gb": round(psutil.virtual_memory().total / (1024 ** 3), 2),
        },
        "disk": {
            "total_gb": round(psutil.disk_usage("/").total / (1024 ** 3), 2),
        },
        "environment": {
            "python_version": platform.python_version(),
            "is_virtual_env": "VIRTUAL_ENV" in os.environ,
        }
    }
