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
# 1. 数据库配置 (SQLAlchemy + SQLite)
# ==========================================
SQLALCHEMY_DATABASE_URL = "sqlite:///./passwords_study.db"

# 创建数据库引擎
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 定义数据库表结构模型
class PasswordRecord(Base):
    __tablename__ = "password_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)      # 用户唯一标识符
    condition = Column(String, index=True)    # 实验条件："Emoji_Password" 或 "Numeric_PIN"
    password_data = Column(String)            # 具体的 4 位密码或表情符号
    selection_time = Column(Float)            # 记录注册阶段选择密码的耗时（秒）
    verification_attempts = Column(Integer, default=None) # 记录回忆阶段成功验证所需的尝试次数
    created_at = Column(DateTime, default=datetime.utcnow) # 记录创建时间

# 在本地创建数据库和表
Base.metadata.create_all(bind=engine)


# ==========================================
# 2. FastAPI 应用初始化与 CORS 配置
# ==========================================
app = FastAPI(title="EmojiAuth Study API")

# 允许跨域请求 (CORS) - 解决前端直接打开 HTML 文件请求后端被拦截的问题
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源（仅限本地原型测试时使用）
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 获取数据库会话的依赖项
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==========================================
# 3. Pydantic 数据验证模型 (定义前端传来的 JSON 结构)
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
# 4. API 路由接口
# ==========================================

@app.get("/")
def read_root():
    return {"message": "欢迎来到身份验证研究后端 API 服务已正常运行！"}

@app.post("/api/save_password")
def save_password(payload: PasswordSubmit, db: Session = Depends(get_db)):
    """
    接收前端发来的注册密码和耗时数据，并存入数据库。
    """
    if not payload.password_data:
        raise HTTPException(status_code=400, detail="密码数据不能为空")
    
    # 创建新记录并存入 SQLite
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
        "message": "密码与时间已成功记录！", 
        "record_id": new_record.id
    }

@app.post("/api/verify_password")
def verify_password(payload: VerifySubmit, db: Session = Depends(get_db)):
    """
    接收前端发来的验证请求，直接通过数据库的主键 ID 比对密码。
    """
    # 直接通过数字 ID 和实验组别查找记录
    record = db.query(PasswordRecord).filter(
        PasswordRecord.id == payload.record_id,
        PasswordRecord.condition == payload.condition
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="未找到该数字 ID 的记录，请检查输入是否正确")

    # 比对密码
    if record.password_data == payload.password_data:
        record.verification_attempts = payload.attempts
        db.commit()
        return {"status": "success", "message": f"验证成功！总共尝试了 {payload.attempts} 次"}
    else:
        raise HTTPException(status_code=401, detail="密码错误，请重试")
    
    @app.get("/api/export_data")
def export_data(db: Session = Depends(get_db)):
    """
    将数据库中的所有实验记录导出为 CSV 文件格式
    """
    # 查询所有记录
    records = db.query(PasswordRecord).all()
    
    # 在内存中创建 CSV
    stream = io.StringIO()
    csv_writer = csv.writer(stream)
    
    # 写入表头 (Header)
    csv_writer.writerow([
        "database ID (record_id)", 
        "User ID (user_id)", 
        "Experiment Condition (condition)", 
        "Set Password (password_data)", 
        "Selection Time (selection_time)", 
        "Verification Attempts (verification_attempts)", 
        "Creation Time (created_at)"
    ])
    
    # 写入数据行
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
    
    # 将内存中的字符串流转换为响应并强制浏览器下载
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    
    # 设置下载的文件名 (带上当前时间戳)
    current_time = datetime.now().strftime("%Y%m%d_%H%M%S")
    response.headers["Content-Disposition"] = f"attachment; filename=study_data_export_{current_time}.csv"
    
    return response