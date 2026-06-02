"""
第二步：執行此腳本將 upload.gs 推送到 GAS 專案
執行：python3 push_code.py
"""
import pickle, json, os
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

SCRIPT_ID    = "1NCcvCOn9FZ9Fvv2XSkmXwBLRZQnuaS22gZ2QrJfgdjV9ijPoN6HUBDXR"
TOKEN_PICKLE = os.path.join(os.path.dirname(__file__), "token.pickle")
GS_FILE      = os.path.join(os.path.dirname(__file__), "upload.gs")

# 載入 token
with open(TOKEN_PICKLE, "rb") as f:
    creds = pickle.load(f)
if creds.expired and creds.refresh_token:
    creds.refresh(Request())
    with open(TOKEN_PICKLE, "wb") as f:
        pickle.dump(creds, f)

# 讀取 GAS 程式碼
with open(GS_FILE, encoding="utf-8") as f:
    gs_code = f.read()

# 推送到專案
svc = build("script", "v1", credentials=creds)
result = svc.projects().updateContent(
    scriptId=SCRIPT_ID,
    body={"files": [
        {
            "name": "upload",
            "type": "SERVER_JS",
            "source": gs_code,
        },
        {
            "name": "appsscript",
            "type": "JSON",
            "source": json.dumps({
                "timeZone": "Asia/Bangkok",
                "dependencies": {},
                "exceptionLogging": "STACKDRIVER",
                "runtimeVersion": "V8",
                "webapp": {
                    "executeAs": "USER_DEPLOYING",
                    "access": "ANYONE_ANONYMOUS",
                },
            }),
        },
    ]}
).execute()

print("✅ 程式碼推送完成！")
print(f"   專案 ID：{SCRIPT_ID}")
print(f"   編輯器：https://script.google.com/home/projects/{SCRIPT_ID}/edit")
