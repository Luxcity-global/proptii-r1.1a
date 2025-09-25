"""
CrewAI Service for Property Marketing
Main FastAPI application with WebSocket support
"""

import os
import asyncio
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from loguru import logger

from config import settings
from agents.property_marketing_crew import PropertyMarketingCrew
from services.websocket_manager import WebSocketManager
from services.job_queue import JobQueue


# Global instances
websocket_manager = WebSocketManager()
job_queue = JobQueue()
property_crew = PropertyMarketingCrew()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    logger.info("🚀 Starting CrewAI Property Marketing Service")
    
    # Initialize services
    await job_queue.initialize()
    await property_crew.initialize()
    
    yield
    
    # Cleanup
    logger.info("🛑 Shutting down CrewAI Service")
    await job_queue.cleanup()
    await websocket_manager.cleanup()


# Create FastAPI app
app = FastAPI(
    title="CrewAI Property Marketing Service",
    description="AI-powered property marketing content generation",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "crewai-property-marketing"}


@app.post("/api/v1/generate")
async def generate_property_content(request: Dict[str, Any]):
    """Generate property marketing content using CrewAI crew"""
    try:
        # Validate request
        if not request.get("property_data"):
            raise HTTPException(status_code=400, detail="property_data is required")
        
        # Create job
        job_id = await job_queue.create_job({
            "type": "property_content_generation",
            "property_data": request["property_data"],
            "platforms": request.get("platforms", ["facebook", "instagram"]),
            "user_id": request.get("user_id"),
            "session_id": request.get("session_id")
        })
        
        return {"job_id": job_id, "status": "queued"}
    
    except Exception as e:
        logger.error(f"Error creating generation job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Get job status and results"""
    try:
        job = await job_queue.get_job(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return {
            "job_id": job_id,
            "status": job["status"],
            "progress": job.get("progress", 0),
            "result": job.get("result"),
            "error": job.get("error")
        }
    
    except Exception as e:
        logger.error(f"Error getting job status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time updates"""
    await websocket_manager.connect(websocket, session_id)
    
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            logger.info(f"Received WebSocket message: {data}")
            
    except WebSocketDisconnect:
        websocket_manager.disconnect(session_id)
        logger.info(f"WebSocket disconnected for session: {session_id}")


async def process_job(job_id: str, job_data: Dict[str, Any]):
    """Process a job using the property marketing crew"""
    try:
        # Update job status
        await job_queue.update_job_status(job_id, "processing", 10)
        
        # Notify via WebSocket
        await websocket_manager.broadcast_to_session(
            job_data.get("session_id"),
            {
                "type": "job_update",
                "job_id": job_id,
                "status": "processing",
                "progress": 10,
                "message": "Starting content generation..."
            }
        )
        
        # Run the crew
        result = await property_crew.process_property_marketing(
            property_data=job_data["property_data"],
            platforms=job_data["platforms"],
            progress_callback=lambda progress, message: asyncio.create_task(
                update_job_progress(job_id, job_data.get("session_id"), progress, message)
            )
        )
        
        # Complete job
        await job_queue.complete_job(job_id, result)
        
        # Final notification
        await websocket_manager.broadcast_to_session(
            job_data.get("session_id"),
            {
                "type": "job_complete",
                "job_id": job_id,
                "status": "completed",
                "progress": 100,
                "result": result
            }
        )
        
    except Exception as e:
        logger.error(f"Error processing job {job_id}: {e}")
        await job_queue.fail_job(job_id, str(e))
        
        await websocket_manager.broadcast_to_session(
            job_data.get("session_id"),
            {
                "type": "job_error",
                "job_id": job_id,
                "status": "failed",
                "error": str(e)
            }
        )


async def update_job_progress(job_id: str, session_id: str, progress: int, message: str):
    """Update job progress and notify via WebSocket"""
    await job_queue.update_job_status(job_id, "processing", progress)
    
    await websocket_manager.broadcast_to_session(
        session_id,
        {
            "type": "job_update",
            "job_id": job_id,
            "status": "processing",
            "progress": progress,
            "message": message
        }
    )


# Start job processor
async def start_job_processor():
    """Start the job processor"""
    while True:
        try:
            job = await job_queue.get_next_job()
            if job:
                asyncio.create_task(process_job(job["job_id"], job["data"]))
            else:
                await asyncio.sleep(1)  # Wait for jobs
        except Exception as e:
            logger.error(f"Error in job processor: {e}")
            await asyncio.sleep(5)


if __name__ == "__main__":
    # Start job processor
    asyncio.create_task(start_job_processor())
    
    # Run the application
    uvicorn.run(
        "main:app",
        host=settings.websocket_host,
        port=settings.websocket_port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )
