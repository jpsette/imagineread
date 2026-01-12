import uuid
import time
from typing import Dict, Optional, Any
from enum import Enum
from pydantic import BaseModel
from loguru import logger

class JobState(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class JobStatus(BaseModel):
    id: str
    type: str
    status: JobState
    result: Optional[Any] = None
    error: Optional[str] = None
    created_at: float
    updated_at: float

class JobManager:
    _instance = None
    _jobs: Dict[str, JobStatus] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(JobManager, cls).__new__(cls)
            # Initialize state if needed, but class attribute _jobs works for singleton behavior 
            # as long as we don't re-initialize it in __init__ incorrectly.
        return cls._instance

    def create_job(self, task_type: str) -> str:
        job_id = str(uuid.uuid4())
        now = time.time()
        
        job = JobStatus(
            id=job_id,
            type=task_type,
            status=JobState.PENDING,
            created_at=now,
            updated_at=now
        )
        
        self._jobs[job_id] = job
        logger.info(f"🆕 Job Created: {job_id} [{task_type}]")
        return job_id

    def update_job(self, job_id: str, status: JobState, result: Optional[Any] = None, error: Optional[str] = None):
        if job_id not in self._jobs:
            logger.error(f"❌ Attempted to update non-existent job: {job_id}")
            return
            
        job = self._jobs[job_id]
        job.status = status
        job.updated_at = time.time()
        
        if result is not None:
            job.result = result
        if error is not None:
            job.error = error
            
        logger.info(f"🔄 Job Updated: {job_id} -> {status}")

    def get_job(self, job_id: str) -> Optional[JobStatus]:
        return self._jobs.get(job_id)

    def list_jobs(self) -> Dict[str, JobStatus]:
        return self._jobs

# Global Instance
job_manager = JobManager()
