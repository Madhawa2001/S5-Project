from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
import jwt, os

security = HTTPBearer()
JWT_SECRET = os.getenv("JWT_SECRET", "changeme")

def verify_jwt(credentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=403, detail="Invalid token")
