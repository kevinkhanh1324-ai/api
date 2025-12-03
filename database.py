"""
MongoDB Atlas Connection Module
Handles database connection and operations for EXE201 project
"""

import os
import logging
from typing import Optional, Dict, Any, List
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MongoDBConnection:
    """
    MongoDB Atlas connection manager
    """
    
    def __init__(self):
        self.client: Optional[MongoClient] = None
        self.database: Optional[Database] = None
        self.connection_string = os.getenv('MONGODB_URI')
        self.database_name = os.getenv('MONGODB_DB_NAME', 'exe201_db')
        
        if not self.connection_string:
            raise ValueError("MONGODB_URI environment variable is required")
    
    def connect(self) -> bool:
        """
        Establish connection to MongoDB Atlas
        
        Returns:
            bool: True if connection successful, False otherwise
        """
        try:
            self.client = MongoClient(
                self.connection_string,
                serverSelectionTimeoutMS=5000  # 5 second timeout
            )
            
            # Test the connection
            self.client.admin.command('ping')
            self.database = self.client[self.database_name]
            
            logger.info(f"Successfully connected to MongoDB Atlas database: {self.database_name}")
            return True
            
        except ConnectionFailure as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            return False
        except ServerSelectionTimeoutError as e:
            logger.error(f"MongoDB server selection timeout: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error connecting to MongoDB: {e}")
            return False
    
    def disconnect(self):
        """
        Close the MongoDB connection
        """
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB Atlas")
    
    def get_collection(self, collection_name: str) -> Optional[Collection]:
        """
        Get a specific collection from the database
        
        Args:
            collection_name (str): Name of the collection
            
        Returns:
            Collection: MongoDB collection object or None if not connected
        """
        if self.database is None:
            logger.error("Database not connected")
            return None
        
        return self.database[collection_name]
    
    def insert_document(self, collection_name: str, document: Dict[str, Any]) -> Optional[str]:
        """
        Insert a single document into a collection
        
        Args:
            collection_name (str): Name of the collection
            document (dict): Document to insert
            
        Returns:
            str: Inserted document ID or None if failed
        """
        try:
            collection = self.get_collection(collection_name)
            if not collection:
                return None
            
            result = collection.insert_one(document)
            logger.info(f"Inserted document with ID: {result.inserted_id}")
            return str(result.inserted_id)
            
        except Exception as e:
            logger.error(f"Error inserting document: {e}")
            return None
    
    def insert_documents(self, collection_name: str, documents: List[Dict[str, Any]]) -> List[str]:
        """
        Insert multiple documents into a collection
        
        Args:
            collection_name (str): Name of the collection
            documents (list): List of documents to insert
            
        Returns:
            list: List of inserted document IDs
        """
        try:
            collection = self.get_collection(collection_name)
            if not collection:
                return []
            
            result = collection.insert_many(documents)
            logger.info(f"Inserted {len(result.inserted_ids)} documents")
            return [str(id) for id in result.inserted_ids]
            
        except Exception as e:
            logger.error(f"Error inserting documents: {e}")
            return []
    
    def find_document(self, collection_name: str, filter_dict: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Find a single document in a collection
        
        Args:
            collection_name (str): Name of the collection
            filter_dict (dict): Filter criteria
            
        Returns:
            dict: Found document or None
        """
        try:
            collection = self.get_collection(collection_name)
            if not collection:
                return None
            
            result = collection.find_one(filter_dict)
            return result
            
        except Exception as e:
            logger.error(f"Error finding document: {e}")
            return None
    
    def find_documents(self, collection_name: str, filter_dict: Dict[str, Any] = None, 
                      limit: int = None) -> List[Dict[str, Any]]:
        """
        Find multiple documents in a collection
        
        Args:
            collection_name (str): Name of the collection
            filter_dict (dict): Filter criteria (None for all documents)
            limit (int): Maximum number of documents to return
            
        Returns:
            list: List of found documents
        """
        try:
            collection = self.get_collection(collection_name)
            if not collection:
                return []
            
            query = filter_dict or {}
            cursor = collection.find(query)
            
            if limit:
                cursor = cursor.limit(limit)
            
            return list(cursor)
            
        except Exception as e:
            logger.error(f"Error finding documents: {e}")
            return []
    
    def update_document(self, collection_name: str, filter_dict: Dict[str, Any], 
                       update_dict: Dict[str, Any]) -> bool:
        """
        Update a single document in a collection
        
        Args:
            collection_name (str): Name of the collection
            filter_dict (dict): Filter criteria
            update_dict (dict): Update operations
            
        Returns:
            bool: True if update successful, False otherwise
        """
        try:
            collection = self.get_collection(collection_name)
            if not collection:
                return False
            
            result = collection.update_one(filter_dict, {"$set": update_dict})
            logger.info(f"Updated {result.modified_count} document(s)")
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error updating document: {e}")
            return False
    
    def delete_document(self, collection_name: str, filter_dict: Dict[str, Any]) -> bool:
        """
        Delete a single document from a collection
        
        Args:
            collection_name (str): Name of the collection
            filter_dict (dict): Filter criteria
            
        Returns:
            bool: True if deletion successful, False otherwise
        """
        try:
            collection = self.get_collection(collection_name)
            if not collection:
                return False
            
            result = collection.delete_one(filter_dict)
            logger.info(f"Deleted {result.deleted_count} document(s)")
            return result.deleted_count > 0
            
        except Exception as e:
            logger.error(f"Error deleting document: {e}")
            return False
    
    def count_documents(self, collection_name: str, filter_dict: Dict[str, Any] = None) -> int:
        """
        Count documents in a collection
        
        Args:
            collection_name (str): Name of the collection
            filter_dict (dict): Filter criteria (None for all documents)
            
        Returns:
            int: Number of documents
        """
        try:
            collection = self.get_collection(collection_name)
            if collection is None:
                return 0
            
            query = filter_dict or {}
            return collection.count_documents(query)
            
        except Exception as e:
            logger.error(f"Error counting documents: {e}")
            return 0


# Global database instance
db_connection = MongoDBConnection()


def get_database_connection() -> MongoDBConnection:
    """
    Get the global database connection instance
    
    Returns:
        MongoDBConnection: Database connection instance
    """
    return db_connection


def connect_to_database() -> bool:
    """
    Connect to the database using the global instance
    
    Returns:
        bool: True if connection successful, False otherwise
    """
    return db_connection.connect()


def disconnect_from_database():
    """
    Disconnect from the database
    """
    db_connection.disconnect()


# Context manager for database operations
class DatabaseContext:
    """
    Context manager for database operations
    """
    
    def __init__(self):
        self.connection = get_database_connection()
    
    def __enter__(self) -> MongoDBConnection:
        if not self.connection.client:
            self.connection.connect()
        return self.connection
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        # Don't close connection in context manager to allow reuse
        pass