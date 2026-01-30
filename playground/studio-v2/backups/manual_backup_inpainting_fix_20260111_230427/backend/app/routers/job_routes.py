import time
import asyncio
from fastapi import APIRouter, BackgroundTasks, HTTPException
from app.services.job_manager import job_manager, JobState

router = APIRouter(prefix="/jobs", tags=["Jobs"])

def _run_test_job(job_id: str):
    """
    Simulates a long running task.
    """
    try:
        job_manager.update_job(job_id, JobState.PROCESSING)
        time.sleep(5)  # Simulate blocking work? Or asyncio.sleep?
        # Since FastAPI runs in a threadpool for def functions, time.sleep is okay-ish for simulation,
        # but for real async work we might want async def and await.
        # However, BackgroundTasks runs standard functions in a threadpool.
        job_manager.update_job(job_id, JobState.COMPLETED, result={"message": "Task finished successfully"})
    except Exception as e:
        job_manager.update_job(job_id, JobState.FAILED, error=str(e))

@router.post("/test")
def create_test_job(background_tasks: BackgroundTasks):
    job_id = job_manager.create_job("TEST_TASK")
    background_tasks.add_task(_run_test_job, job_id)
    return {"job_id": job_id, "status": "PENDING"}

@router.get("/{job_id}")
def get_job_status(job_id: str):
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
