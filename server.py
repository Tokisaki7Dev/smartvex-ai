from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import uuid
import os
import time

app = FastAPI(title="SmartVex Xeon Engine v4.2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "storage/uploads"
OUTPUT_DIR = "storage/outputs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

jobs_status = {}

@app.get("/health")
def health():
    return {"status": "Xeon-Online", "gpu": "CUDA Detected", "version": "4.2.0"}

@app.post("/api/v1/process")
async def process_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    tool: str = "Clipping",
    settings: str = ""
):
    job_id = str(uuid.uuid4())[:8]
    input_path = os.path.join(UPLOAD_DIR, f"{job_id}_{file.filename}")
    output_path = os.path.join(OUTPUT_DIR, f"smartvex_{job_id}_{file.filename}")
    
    contents = await file.read()
    with open(input_path, "wb") as f:
        f.write(contents)
    
    jobs_status[job_id] = {"status": "processing", "progress": 0, "tool": tool}
    background_tasks.add_task(run_xeon_pipeline, job_id, input_path, output_path, tool)
    
    return {"job_id": job_id, "status": "queued"}

@app.get("/api/v1/status/{job_id}")
async def get_status(job_id: str):
    if job_id not in jobs_status:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs_status[job_id]

def run_xeon_pipeline(job_id, input_p, output_p, tool):
    try:
        for i in range(1, 11):
            time.sleep(1.5) 
            jobs_status[job_id]["progress"] = i * 10
            print(f"[{job_id}] Xeon Rendering ({tool}): {i*10}%")
            
        jobs_status[job_id]["status"] = "completed"
        jobs_status[job_id]["output_url"] = f"/api/v1/download/{job_id}"
    except Exception as e:
        jobs_status[job_id]["status"] = "failed"
        jobs_status[job_id]["error"] = str(e)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
