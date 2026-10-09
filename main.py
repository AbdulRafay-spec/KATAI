from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Cancer Detection Backend is Running"}