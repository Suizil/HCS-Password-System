代码原型说明

操作步骤：
1.需要FastAPI、Uvicorn以及 SQLAlchemy。安装指令：pip install fastapi uvicorn sqlalchemy pydantic

2.启动服务器需要要在终端输入：uvicorn main:app --reload

3.点击http://127.0.0.1:8000，页面上显示"message": "欢迎来到身份验证研究后端 API 服务已正常运行！"表明后端启动成功。

4.启动网页前端需要打开并运行index.html和verify.html文件，现在只需要启动任意一个文件即可。

5.进入index网页前端后需要选择表情密码输入或pin数字密码输入，开始输入需要点击开始按钮才能输入，当输入结束点击提交自动记录输入时间。如果需要打乱键盘分布需要勾选每次重置时打乱键盘布局选项。

6.当输入密码完成后，点击前往密码验证阶段 (Go to Verify) ➔链接可以直接进入验证页面verify.html。

7.验证页面需要输入被测试者的测试 ID，ID将会在提交输入密码时显示出来。然后就需要被测试者回忆并输入之前设置的密码，输入次数会被记录下来，直至输入正确。

8.完成验证后在终端输入ctrl+c可以结束服务器运行，同时被测试者的ID、密码和输入次数等数据将会记录在passwords_study数据库中。