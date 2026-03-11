from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
import uuid

# --- 数据库配置 (SQLAlchemy + SQLite) ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./passwords_study.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 定义数据库模型 (存储用户密码记录)
# 出于科学分析的目的，研究中的密码会被明文存储 
class PasswordRecord(Base):
    __tablename__ = "password_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)      # 用户唯一标识
    condition = Column(String, index=True)    # 实验条件："Numeric_PIN" 或 "Emoji_Password"
    password_data = Column(String)            # 具体的4位密码或表情符号短代码
    created_at = Column(DateTime, default=datetime.utcnow)

# 创建数据库表
Base.metadata.create_all(bind=engine)

# --- FastAPI 应用初始化 ---
app = FastAPI(title="Authentication Study API")

# 获取数据库会话的依赖项
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Pydantic 数据验证模型 (前端传来的JSON结构) ---
class PasswordSubmit(BaseModel):
    user_id: str
    condition: str
    password_data: str

# --- API 路由 ---
@app.post("/api/save_password")
def save_password(payload: PasswordSubmit, db: Session = Depends(get_db)):
    # 简单的后端校验：确保密码长度为 4 [cite: 582]
    # 注意：表情符号前端传过来可能是数组转成的字符串，这里简化为检查字符串是否存在
    if not payload.password_data:
        raise HTTPException(status_code=400, detail="Password data cannot be empty")
    
    # 将数据存入 SQLite
    new_record = PasswordRecord(
        user_id=payload.user_id,
        condition=payload.condition,
        password_data=payload.password_data
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    
    return {"status": "success", "message": "Password securely recorded for study.", "record_id": new_record.id}

@app.get("/")
def read_root():
    return {"message": "Welcome to the Authentication Study API."}

from fastapi.middleware.cors import CORSMiddleware

# 在 app = FastAPI(...) 之后添加：
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 允许所有来源（仅限原型测试时使用）
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)