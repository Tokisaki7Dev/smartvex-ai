from sqlalchemy import Column, Integer, String, Enum, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()

class JobStatus(str, enum.Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class VideoTool(str, enum.Enum):
    CUT = "Cut"
    CAPTION = "Caption"
    COMPRESS = "Compress"
    CONVERT = "Convert"
    AUDIO = "Audio"
    ENHANCER = "Enhancer"

class VideoJob(Base):
    __tablename__ = "video_jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    original_name = Column(String)
    status = Column(Enum(JobStatus), default=JobStatus.QUEUED)
    tool_used = Column(Enum(VideoTool))
    output_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
