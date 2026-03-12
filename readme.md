

2.运行后端要在终端输入：uvicorn main:app --reload

3.在index.html里运行，不要点击分配的http链接

4.退出用ctrl+c

代码原型说明

操作步骤：
1.需要FastAPI、Uvicorn以及 SQLAlchemy。安装指令：pip install fastapi uvicorn sqlalchemy pydantic

2.启动服务器需要要在终端输入：uvicorn main:app --reload

3.点击http://127.0.0.1:8000，页面上显示"message": "欢迎来到身份验证研究后端 API 服务已正常运行！"表明后端启动成功。

4.启动网页前端需要打开并运行index.html和verify.html文件，现在只需要启动任意一个文件即可。

5.进入index网页前端后需要选择