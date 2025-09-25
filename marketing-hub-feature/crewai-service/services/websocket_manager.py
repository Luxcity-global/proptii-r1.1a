"""
WebSocket Manager for real-time communication
Manages WebSocket connections and broadcasting
"""

import asyncio
import json
from typing import Dict, List, Set
from fastapi import WebSocket
from loguru import logger


class WebSocketManager:
    """Manages WebSocket connections and broadcasting"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.session_connections: Dict[str, Set[str]] = {}
        self.connection_lock = asyncio.Lock()
    
    async def connect(self, websocket: WebSocket, session_id: str):
        """Accept a WebSocket connection"""
        await websocket.accept()
        connection_id = id(websocket)
        
        async with self.connection_lock:
            self.active_connections[str(connection_id)] = websocket
            
            if session_id not in self.session_connections:
                self.session_connections[session_id] = set()
            self.session_connections[session_id].add(str(connection_id))
        
        logger.info(f"WebSocket connected: {connection_id} for session: {session_id}")
    
    def disconnect(self, session_id: str):
        """Disconnect WebSocket connections for a session"""
        if session_id in self.session_connections:
            connection_ids = self.session_connections[session_id].copy()
            
            for connection_id in connection_ids:
                if connection_id in self.active_connections:
                    del self.active_connections[connection_id]
                self.session_connections[session_id].discard(connection_id)
            
            if not self.session_connections[session_id]:
                del self.session_connections[session_id]
        
        logger.info(f"WebSocket disconnected for session: {session_id}")
    
    async def send_personal_message(self, message: str, connection_id: str):
        """Send message to a specific connection"""
        if connection_id in self.active_connections:
            try:
                await self.active_connections[connection_id].send_text(message)
            except Exception as e:
                logger.error(f"Error sending message to {connection_id}: {e}")
                # Remove failed connection
                await self._remove_connection(connection_id)
    
    async def broadcast_to_session(self, session_id: str, message: dict):
        """Broadcast message to all connections in a session"""
        if session_id in self.session_connections:
            message_text = json.dumps(message)
            connection_ids = self.session_connections[session_id].copy()
            
            for connection_id in connection_ids:
                await self.send_personal_message(message_text, connection_id)
    
    async def broadcast_to_all(self, message: dict):
        """Broadcast message to all active connections"""
        message_text = json.dumps(message)
        connection_ids = list(self.active_connections.keys())
        
        for connection_id in connection_ids:
            await self.send_personal_message(message_text, connection_id)
    
    async def get_connection_count(self) -> int:
        """Get total number of active connections"""
        return len(self.active_connections)
    
    async def get_session_count(self) -> int:
        """Get total number of active sessions"""
        return len(self.session_connections)
    
    async def cleanup(self):
        """Clean up all connections"""
        async with self.connection_lock:
            for websocket in self.active_connections.values():
                try:
                    await websocket.close()
                except Exception as e:
                    logger.error(f"Error closing WebSocket: {e}")
            
            self.active_connections.clear()
            self.session_connections.clear()
        
        logger.info("WebSocket manager cleaned up")
    
    async def _remove_connection(self, connection_id: str):
        """Remove a connection from all tracking"""
        async with self.connection_lock:
            if connection_id in self.active_connections:
                del self.active_connections[connection_id]
            
            # Remove from session tracking
            for session_id, connections in self.session_connections.items():
                connections.discard(connection_id)
                if not connections:
                    del self.session_connections[session_id]
                    break
