"""
MongoDB Test API Endpoints
Simple endpoints to test MongoDB Atlas connection on Render
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
from database import DatabaseContext, connect_to_database

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mongodb-test", tags=["MongoDB Test"])

class HealthResponse(BaseModel):
    status: str
    database: str
    collections: List[str]
    timestamp: datetime

class TestUser(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None

class TestUserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    created_at: datetime

@router.get("/health", response_model=HealthResponse)
async def mongodb_health_check():
    """
    Test MongoDB Atlas connection and list available collections
    """
    try:
        # Test connection
        connection_success = connect_to_database()
        if not connection_success:
            raise HTTPException(status_code=500, detail="Failed to connect to MongoDB Atlas")
        
        with DatabaseContext() as db:
            # Get collections
            collections = []
            try:
                collections = db.database.list_collection_names()
            except Exception as e:
                logger.warning(f"Could not list collections: {e}")
                collections = []
            
            return HealthResponse(
                status="healthy",
                database=db.database_name,
                collections=collections,
                timestamp=datetime.utcnow()
            )
            
    except Exception as e:
        logger.error(f"MongoDB health check failed: {e}")
        raise HTTPException(status_code=500, detail=f"MongoDB health check failed: {str(e)}")

@router.post("/users", response_model=TestUserResponse)
async def create_test_user(user: TestUser):
    """
    Create a test user in MongoDB Atlas
    """
    try:
        with DatabaseContext() as db:
            user_data = {
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "created_at": datetime.utcnow(),
                "is_test": True
            }
            
            user_id = db.insert_document("test_users", user_data)
            if not user_id:
                raise HTTPException(status_code=500, detail="Failed to create user")
            
            return TestUserResponse(
                id=user_id,
                username=user.username,
                email=user.email,
                full_name=user.full_name,
                created_at=user_data["created_at"]
            )
            
    except Exception as e:
        logger.error(f"Error creating test user: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")

@router.get("/users", response_model=List[TestUserResponse])
async def get_test_users():
    """
    Get all test users from MongoDB Atlas
    """
    try:
        with DatabaseContext() as db:
            users = db.find_documents("test_users", {"is_test": True}, limit=10)
            
            result = []
            for user in users:
                result.append(TestUserResponse(
                    id=str(user["_id"]),
                    username=user["username"],
                    email=user["email"],
                    full_name=user.get("full_name"),
                    created_at=user["created_at"]
                ))
            
            return result
            
    except Exception as e:
        logger.error(f"Error getting test users: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting users: {str(e)}")

@router.get("/users/count")
async def count_test_users():
    """
    Count test users in MongoDB Atlas
    """
    try:
        with DatabaseContext() as db:
            count = db.count_documents("test_users", {"is_test": True})
            return {"count": count}
            
    except Exception as e:
        logger.error(f"Error counting test users: {e}")
        raise HTTPException(status_code=500, detail=f"Error counting users: {str(e)}")

@router.delete("/users/cleanup")
async def cleanup_test_users():
    """
    Clean up all test users from MongoDB Atlas
    """
    try:
        with DatabaseContext() as db:
            collection = db.get_collection("test_users")
            if collection is None:
                raise HTTPException(status_code=500, detail="Could not access collection")
            
            result = collection.delete_many({"is_test": True})
            return {"deleted_count": result.deleted_count}
            
    except Exception as e:
        logger.error(f"Error cleaning up test users: {e}")
        raise HTTPException(status_code=500, detail=f"Error cleaning up: {str(e)}")

@router.get("/connection-info")
async def get_connection_info():
    """
    Get MongoDB connection information (without sensitive data)
    """
    try:
        with DatabaseContext() as db:
            connection_string = db.connection_string
            # Hide password in connection string
            safe_connection = connection_string.replace(
                connection_string.split("://")[1].split("@")[0],
                "***:***"
            ) if connection_string else "Not configured"
            
            return {
                "database_name": db.database_name,
                "connection_string": safe_connection,
                "connected": db.client is not None
            }
            
    except Exception as e:
        logger.error(f"Error getting connection info: {e}")
        return {
            "database_name": "Unknown",
            "connection_string": "Error getting info",
            "connected": False,
            "error": str(e)
        }

@router.post("/stress-test")
async def stress_test_mongodb():
    """
    Stress test MongoDB Atlas connection with multiple operations
    """
    try:
        results = {
            "operations": [],
            "total_time": 0,
            "errors": []
        }
        
        start_time = datetime.utcnow()
        
        with DatabaseContext() as db:
            # Test 1: Insert multiple documents
            try:
                test_docs = [
                    {"test_id": i, "data": f"stress_test_{i}", "timestamp": datetime.utcnow()}
                    for i in range(5)
                ]
                doc_ids = db.insert_documents("stress_test", test_docs)
                results["operations"].append({
                    "operation": "bulk_insert",
                    "success": len(doc_ids) > 0,
                    "count": len(doc_ids)
                })
            except Exception as e:
                results["errors"].append(f"Bulk insert error: {e}")
            
            # Test 2: Find documents
            try:
                found_docs = db.find_documents("stress_test", {})
                results["operations"].append({
                    "operation": "find_all",
                    "success": True,
                    "count": len(found_docs)
                })
            except Exception as e:
                results["errors"].append(f"Find error: {e}")
            
            # Test 3: Update documents
            try:
                updated = db.update_document(
                    "stress_test", 
                    {"test_id": 0}, 
                    {"updated": True, "update_time": datetime.utcnow()}
                )
                results["operations"].append({
                    "operation": "update",
                    "success": updated
                })
            except Exception as e:
                results["errors"].append(f"Update error: {e}")
            
            # Test 4: Count documents
            try:
                count = db.count_documents("stress_test")
                results["operations"].append({
                    "operation": "count",
                    "success": True,
                    "count": count
                })
            except Exception as e:
                results["errors"].append(f"Count error: {e}")
            
            # Cleanup
            try:
                collection = db.get_collection("stress_test")
                if collection:
                    delete_result = collection.delete_many({})
                    results["operations"].append({
                        "operation": "cleanup",
                        "success": True,
                        "deleted": delete_result.deleted_count
                    })
            except Exception as e:
                results["errors"].append(f"Cleanup error: {e}")
        
        end_time = datetime.utcnow()
        results["total_time"] = (end_time - start_time).total_seconds()
        
        return results
        
    except Exception as e:
        logger.error(f"Stress test failed: {e}")
        raise HTTPException(status_code=500, detail=f"Stress test failed: {str(e)}")