"""
Gunicorn configuration for production deployment
Optimized for Hostinger hosting environment
"""

import multiprocessing
import os

# Server socket
bind = "0.0.0.0:8000"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 5
max_requests = 1000
max_requests_jitter = 50

# Restart workers after this many requests, with jitter
preload_app = True

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Process naming
proc_name = "project_management"

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# Application
pythonpath = "/path/to/your/project"
chdir = "/path/to/your/project/backend"

# Environment
raw_env = [
    "DJANGO_SETTINGS_MODULE=project_management.settings_production",
]

# SSL (uncomment when you have SSL certificate)
# keyfile = "/path/to/your/ssl/private.key"
# certfile = "/path/to/your/ssl/certificate.crt"

# Performance tuning
worker_tmp_dir = "/dev/shm"  # Use shared memory for better performance

# Graceful shutdown
graceful_timeout = 120

# User/Group (set appropriate user for your hosting environment)
# user = "www-data"
# group = "www-data"

def when_ready(server):
    server.log.info("Server is ready. Spawning workers")

def worker_int(worker):
    worker.log.info("worker received INT or QUIT signal")

def pre_fork(server, worker):
    server.log.info("Worker spawned (pid: %s)", worker.pid)

def post_fork(server, worker):
    server.log.info("Worker spawned (pid: %s)", worker.pid)

def post_worker_init(worker):
    worker.log.info("Worker initialized (pid: %s)", worker.pid)

def worker_abort(worker):
    worker.log.info("Worker aborted (pid: %s)", worker.pid) 