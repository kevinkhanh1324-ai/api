"""
MongoDB Atlas Usage Examples
Demonstrates how to use the MongoDB connection module
"""

import sys
import os
from datetime import datetime

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import DatabaseContext, connect_to_database, get_database_connection


def example_user_operations():
    """
    Example operations for user management
    """
    print("=== User Management Examples ===")
    
    with DatabaseContext() as db:
        # Insert a new user
        user_data = {
            "username": "testuser",
            "email": "test@example.com", 
            "password_hash": "hashed_password_here",
            "role": "parent",
            "created_at": datetime.utcnow(),
            "profile": {
                "full_name": "Test User",
                "phone": "+84123456789"
            }
        }
        
        user_id = db.insert_document("users", user_data)
        print(f"✅ Inserted user with ID: {user_id}")
        
        # Find user by email
        found_user = db.find_document("users", {"email": "test@example.com"})
        if found_user:
            print(f"✅ Found user: {found_user['username']}")
        
        # Update user profile
        update_success = db.update_document(
            "users",
            {"email": "test@example.com"},
            {"profile.phone": "+84987654321", "updated_at": datetime.utcnow()}
        )
        print(f"✅ Update user: {'Success' if update_success else 'Failed'}")
        
        # Count users
        user_count = db.count_documents("users")
        print(f"✅ Total users: {user_count}")


def example_package_operations():
    """
    Example operations for package management
    """
    print("\n=== Package Management Examples ===")
    
    with DatabaseContext() as db:
        # Insert packages
        packages = [
            {
                "name": "Gói Cơ Bản",
                "description": "Gói dịch vụ cơ bản cho trẻ em",
                "price": 100000,
                "duration_days": 30,
                "features": ["Giám sát cơ bản", "Thông báo an toàn"],
                "is_active": True,
                "created_at": datetime.utcnow()
            },
            {
                "name": "Gói Pro",
                "description": "Gói dịch vụ chuyên nghiệp",
                "price": 300000,
                "duration_days": 30,
                "features": ["Giám sát nâng cao", "AI phát hiện bạo lực", "Báo cáo chi tiết"],
                "is_active": True,
                "created_at": datetime.utcnow()
            }
        ]
        
        package_ids = db.insert_documents("packages", packages)
        print(f"✅ Inserted {len(package_ids)} packages")
        
        # Find active packages
        active_packages = db.find_documents("packages", {"is_active": True})
        print(f"✅ Found {len(active_packages)} active packages")
        
        for package in active_packages:
            print(f"   - {package['name']}: {package['price']:,} VND")


def example_payment_operations():
    """
    Example operations for payment tracking
    """
    print("\n=== Payment Management Examples ===")
    
    with DatabaseContext() as db:
        # Insert payment record
        payment_data = {
            "user_id": "user_object_id_here",
            "package_id": "package_object_id_here", 
            "amount": 300000,
            "currency": "VND",
            "status": "pending",
            "order_id": "ORDER_12345",
            "payment_method": "payos",
            "created_at": datetime.utcnow(),
            "metadata": {
                "source": "web_app",
                "user_agent": "Mozilla/5.0..."
            }
        }
        
        payment_id = db.insert_document("payments", payment_data)
        print(f"✅ Created payment with ID: {payment_id}")
        
        # Update payment status
        update_success = db.update_document(
            "payments",
            {"order_id": "ORDER_12345"},
            {
                "status": "completed",
                "completed_at": datetime.utcnow(),
                "transaction_id": "TXN_67890"
            }
        )
        print(f"✅ Payment update: {'Success' if update_success else 'Failed'}")
        
        # Find payments by status
        completed_payments = db.find_documents("payments", {"status": "completed"})
        print(f"✅ Found {len(completed_payments)} completed payments")


def example_violence_detection_logs():
    """
    Example operations for violence detection logs
    """
    print("\n=== Violence Detection Logs Examples ===")
    
    with DatabaseContext() as db:
        # Insert detection log
        detection_log = {
            "user_id": "user_object_id_here",
            "camera_id": "camera_001",
            "detection_type": "violence",
            "confidence_score": 0.89,
            "timestamp": datetime.utcnow(),
            "location": {
                "lat": 10.762622,
                "lng": 106.660172,
                "address": "Quận 1, TP.HCM"
            },
            "image_url": "/uploads/detection_20231203_123456.jpg",
            "status": "alert_sent",
            "metadata": {
                "model_version": "v2.1",
                "processing_time_ms": 450
            }
        }
        
        log_id = db.insert_document("detection_logs", detection_log)
        print(f"✅ Created detection log with ID: {log_id}")
        
        # Find recent detections
        recent_detections = db.find_documents(
            "detection_logs",
            {"detection_type": "violence"},
            limit=10
        )
        print(f"✅ Found {len(recent_detections)} recent violence detections")


def example_database_health_check():
    """
    Check database connection and basic operations
    """
    print("\n=== Database Health Check ===")
    
    # Test connection
    connection_success = connect_to_database()
    print(f"✅ Database connection: {'Success' if connection_success else 'Failed'}")
    
    if connection_success:
        db = get_database_connection()
        
        # List collections
        try:
            collections = db.database.list_collection_names()
            print(f"✅ Available collections: {', '.join(collections) if collections else 'None'}")
        except Exception as e:
            print(f"❌ Error listing collections: {e}")
        
        # Test basic operations
        test_doc = {"test": True, "timestamp": datetime.utcnow()}
        test_id = db.insert_document("health_check", test_doc)
        
        if test_id:
            print(f"✅ Test insert successful: {test_id}")
            
            # Clean up test document
            deleted = db.delete_document("health_check", {"_id": test_id})
            print(f"✅ Test cleanup: {'Success' if deleted else 'Failed'}")


def main():
    """
    Main function to run all examples
    """
    print("🚀 MongoDB Atlas Connection Examples")
    print("=" * 50)
    
    # Check if environment variables are set
    import os
    if not os.getenv('MONGODB_URI'):
        print("❌ MONGODB_URI environment variable not set!")
        print("Please update your .env file with MongoDB Atlas connection string")
        return
    
    # Run examples
    try:
        example_database_health_check()
        example_user_operations() 
        example_package_operations()
        example_payment_operations()
        example_violence_detection_logs()
        
        print("\n✅ All examples completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error running examples: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()