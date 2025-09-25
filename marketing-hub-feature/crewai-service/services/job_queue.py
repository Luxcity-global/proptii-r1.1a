"""
Job Queue Service for managing CrewAI tasks
Handles job creation, processing, and status tracking
"""

import asyncio
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from enum import Enum
from loguru import logger


class JobStatus(str, Enum):
    """Job status enumeration"""
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class JobQueue:
    """In-memory job queue for CrewAI tasks"""
    
    def __init__(self):
        self.jobs: Dict[str, Dict[str, Any]] = {}
        self.job_lock = asyncio.Lock()
        self.processing_queue = asyncio.Queue()
        self.max_jobs = 1000  # Maximum jobs to keep in memory
        self.job_ttl = timedelta(hours=24)  # Job time-to-live
    
    async def initialize(self):
        """Initialize the job queue"""
        logger.info("Job queue initialized")
    
    async def cleanup(self):
        """Clean up the job queue"""
        async with self.job_lock:
            self.jobs.clear()
            # Clear the processing queue
            while not self.processing_queue.empty():
                try:
                    self.processing_queue.get_nowait()
                except asyncio.QueueEmpty:
                    break
        
        logger.info("Job queue cleaned up")
    
    async def create_job(self, job_data: Dict[str, Any]) -> str:
        """Create a new job and return job ID"""
        job_id = str(uuid.uuid4())
        
        job = {
            "job_id": job_id,
            "status": JobStatus.QUEUED,
            "data": job_data,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "progress": 0,
            "result": None,
            "error": None,
            "retries": 0,
            "max_retries": 3
        }
        
        async with self.job_lock:
            # Clean up old jobs if we're at the limit
            if len(self.jobs) >= self.max_jobs:
                await self._cleanup_old_jobs()
            
            self.jobs[job_id] = job
        
        # Add to processing queue
        await self.processing_queue.put(job_id)
        
        logger.info(f"Created job: {job_id}")
        return job_id
    
    async def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job by ID"""
        async with self.job_lock:
            job = self.jobs.get(job_id)
            if job:
                # Check if job has expired
                if datetime.now() - job["created_at"] > self.job_ttl:
                    del self.jobs[job_id]
                    return None
                return job
            return None
    
    async def get_next_job(self) -> Optional[Dict[str, Any]]:
        """Get the next job from the processing queue"""
        try:
            job_id = self.processing_queue.get_nowait()
            job = await self.get_job(job_id)
            
            if job and job["status"] == JobStatus.QUEUED:
                return job
            elif job and job["status"] == JobStatus.FAILED and job["retries"] < job["max_retries"]:
                # Retry failed job
                job["retries"] += 1
                job["status"] = JobStatus.QUEUED
                job["updated_at"] = datetime.now()
                return job
            
        except asyncio.QueueEmpty:
            pass
        
        return None
    
    async def update_job_status(self, job_id: str, status: JobStatus, progress: int = None):
        """Update job status and progress"""
        async with self.job_lock:
            if job_id in self.jobs:
                job = self.jobs[job_id]
                job["status"] = status
                job["updated_at"] = datetime.now()
                
                if progress is not None:
                    job["progress"] = progress
                
                logger.info(f"Updated job {job_id}: {status} ({progress}%)")
    
    async def complete_job(self, job_id: str, result: Any):
        """Mark job as completed with result"""
        async with self.job_lock:
            if job_id in self.jobs:
                job = self.jobs[job_id]
                job["status"] = JobStatus.COMPLETED
                job["progress"] = 100
                job["result"] = result
                job["updated_at"] = datetime.now()
                
                logger.info(f"Completed job: {job_id}")
    
    async def fail_job(self, job_id: str, error: str):
        """Mark job as failed with error"""
        async with self.job_lock:
            if job_id in self.jobs:
                job = self.jobs[job_id]
                job["status"] = JobStatus.FAILED
                job["error"] = error
                job["updated_at"] = datetime.now()
                
                logger.error(f"Failed job: {job_id} - {error}")
    
    async def cancel_job(self, job_id: str):
        """Cancel a job"""
        async with self.job_lock:
            if job_id in self.jobs:
                job = self.jobs[job_id]
                if job["status"] in [JobStatus.QUEUED, JobStatus.PROCESSING]:
                    job["status"] = JobStatus.CANCELLED
                    job["updated_at"] = datetime.now()
                    
                    logger.info(f"Cancelled job: {job_id}")
    
    async def get_job_statistics(self) -> Dict[str, Any]:
        """Get job queue statistics"""
        async with self.job_lock:
            total_jobs = len(self.jobs)
            status_counts = {}
            
            for job in self.jobs.values():
                status = job["status"]
                status_counts[status] = status_counts.get(status, 0) + 1
            
            return {
                "total_jobs": total_jobs,
                "status_counts": status_counts,
                "queue_size": self.processing_queue.qsize(),
                "oldest_job": min(
                    (job["created_at"] for job in self.jobs.values()),
                    default=None
                )
            }
    
    async def _cleanup_old_jobs(self):
        """Clean up old completed/failed jobs"""
        now = datetime.now()
        jobs_to_remove = []
        
        for job_id, job in self.jobs.items():
            # Remove jobs older than TTL or completed/failed jobs older than 1 hour
            if (
                now - job["created_at"] > self.job_ttl or
                (job["status"] in [JobStatus.COMPLETED, JobStatus.FAILED] and 
                 now - job["updated_at"] > timedelta(hours=1))
            ):
                jobs_to_remove.append(job_id)
        
        for job_id in jobs_to_remove:
            del self.jobs[job_id]
        
