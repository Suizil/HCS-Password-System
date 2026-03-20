Code Prototype Explanation

GitHub Address: https://github.com/Suizil/HCS-Password-System.git

Operation Steps:

1. Requires FastAPI, Uvicorn, and SQLAlchemy. Installation command: "pip install fastapi uvicorn sqlalchemy pydantic"

2. To start the server, enter the following in the terminal: "uvicorn main:app --reload"

3. Click http://127.0.0.1:8000. The page will display "message": "Welcome to the authentication research backend API service is running normally!", indicating that the backend has started successfully.

4. To start the web frontend, open and run the `index.html` and "verify.html" files. You only need to start either one.

5. After entering the `index.html` web frontend, you need to choose between emoji password input or PIN numeric password input. Click the "Start" button to begin inputting. Click "Submit" to automatically record the input time. If you need to shuffle the keyboard layout, check the "Shuffle keyboard layout on each reset" option.

6. After entering your password, click "Go to Verify" ➔ This link will directly take you to the verification page "verify.html".

7. The verification page requires the test subject's test ID, which will be displayed when submitting the password. The test subject then needs to recall and re-enter the previously set password. The number of attempts will be recorded until the correct password is entered.

8. Clicking the "📊 Export All Experiment Data (CSV)" button will export the database data to a CSV file.

9. After completing the verification, pressing Ctrl+C in the terminal will terminate the server. The test subject's ID, password, and number of attempts will be recorded in the passwords_study database.
