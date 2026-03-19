from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
import csv
import io
from fastapi.responses import StreamingResponse

# ==========================================
# 1. Database Configuration (SQLAlchemy + SQLite)
# ==========================================
SQLALCHEMY_DATABASE_URL = "sqlite:///./passwords_study.db"

# Create a database engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Define database table structure model
class PasswordRecord(Base):
    __tablename__ = "password_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)      # 用户唯一标识符
    condition = Column(String, index=True)    # 实验条件："Emoji_Password" 或 "Numeric_PIN"
    password_data = Column(String)            # 具体的 4 位密码或表情符号
    selection_time = Column(Float)            # 记录注册阶段选择密码的耗时（秒）
    verification_attempts = Column(Integer, default=None) # 记录回忆阶段成功验证所需的尝试次数
    created_at = Column(DateTime, default=datetime.utcnow) # 记录创建时间

# Create databases and tables locally.
Base.metadata.create_all(bind=engine)


# ==========================================
# 2. FastAPI Application Initialization and CORS Configuration
# ==========================================
app = FastAPI(title="EmojiAuth Study API")

# Allow Cross-Origin Requests (CORS) - Solve the problem of the backend blocking requests when the frontend directly opens an HTML file.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependencies for obtaining database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==========================================
# 3. Pydantic Data Validation Model (Define the JSON structure sent from the front end)
# ==========================================
class PasswordSubmit(BaseModel):
    user_id: str
    condition: str
    password_data: str
    selection_time: float 

class VerifySubmit(BaseModel):
    record_id: int  
    condition: str
    password_data: str
    attempts: int


# ==========================================
# 4. API Routing Interface
# ==========================================

@app.get("/")
def read_root():
    return {"message": "Welcome to the EmojiAuth Study API! Please use the /api endpoints to submit and verify passwords."}

@app.post("/api/save_password")
def save_password(payload: PasswordSubmit, db: Session = Depends(get_db)):
    """
    Receive the registration password and time consumption data sent from the front end and store them in the database.
    """
    if not payload.password_data:
        raise HTTPException(status_code=400, detail="Password data cannot be empty")
    
    # Create a new record and store it in SQLite
    new_record = PasswordRecord(
        user_id=payload.user_id,
        condition=payload.condition,
        password_data=payload.password_data,
        selection_time=payload.selection_time 
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    
    return {
        "status": "success", 
        "message": "Password and time have been successfully recorded!", 
        "record_id": new_record.id
    }

@app.post("/api/verify_password")
def verify_password(payload: VerifySubmit, db: Session = Depends(get_db)):
    """
    Upon receiving a verification request from the front end, the password is directly compared using the primary key ID in the database.
    """
    # Records can be searched directly by numeric ID and experimental group.
    record = db.query(PasswordRecord).filter(
        PasswordRecord.id == payload.record_id,
        PasswordRecord.condition == payload.condition
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Record not found for the given ID. Please check your input.")

    # Compare passwords
    if record.password_data == payload.password_data:
        record.verification_attempts = payload.attempts
        db.commit()
        return {"status": "success", "message": f"Verification successful! Total attempts: {payload.attempts}"}
    else:
        raise HTTPException(status_code=401, detail="Incorrect password, please try again.")


@app.get("/api/export_data")
def export_data(db: Session = Depends(get_db)):
    """
    Export all experimental records from the database as a CSV file.
    """
    # Query all records
    records = db.query(PasswordRecord).all()
    
    # Create CSV in memory
    stream = io.StringIO()
    csv_writer = csv.writer(stream)
    
    # Write the table header
    csv_writer.writerow([
        "database ID (record_id)", 
        "User ID (user_id)", 
        "Experiment Condition (condition)", 
        "Set Password (password_data)", 
        "Selection Time (selection_time)", 
        "Verification Attempts (verification_attempts)", 
        "Creation Time (created_at)"
    ])
    
    # Write data rows
    for r in records:
        csv_writer.writerow([
            r.id, 
            r.user_id, 
            r.condition, 
            r.password_data, 
            r.selection_time, 
            r.verification_attempts, 
            r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else ""
        ])
    
    # Convert the string stream in memory into a response and force the browser to download it.
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    
    # Set the filename for download (including the current timestamp)
    current_time = datetime.now().strftime("%Y%m%d_%H%M%S")
    response.headers["Content-Disposition"] = f"attachment; filename=study_data_export_{current_time}.csv"
    
    return response
