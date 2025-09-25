"""
Configuration management for CrewAI Service
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings"""
    
    # CrewAI Configuration
    crewai_verbose: bool = Field(default=True, description="Enable CrewAI verbose logging")
    crewai_memory: bool = Field(default=True, description="Enable CrewAI memory")
    
    # API Keys
    openai_api_key: Optional[str] = Field(default=None, description="OpenAI API key")
    anthropic_api_key: Optional[str] = Field(default=None, description="Anthropic API key")
    
    # Database Configuration
    database_url: str = Field(
        default="postgresql://user:password@localhost:5432/marketing_hub",
        description="Database connection URL"
    )
    redis_url: str = Field(
        default="redis://localhost:6379",
        description="Redis connection URL"
    )
    
    # WebSocket Configuration
    websocket_host: str = Field(default="0.0.0.0", description="WebSocket host")
    websocket_port: int = Field(default=8002, description="WebSocket port")
    
    # Logging
    log_level: str = Field(default="INFO", description="Log level")
    debug: bool = Field(default=False, description="Debug mode")
    
    # UK Property Market APIs
    uk_property_api_key: Optional[str] = Field(default=None, description="UK Property API key")
    epc_api_key: Optional[str] = Field(default=None, description="EPC API key")
    
    # CrewAI Agent Configuration
    max_agent_iterations: int = Field(default=5, description="Maximum agent iterations")
    agent_timeout: int = Field(default=300, description="Agent timeout in seconds")
    
    # Job Queue Configuration
    max_concurrent_jobs: int = Field(default=5, description="Maximum concurrent jobs")
    job_timeout: int = Field(default=600, description="Job timeout in seconds")
    
    # Demo Mode Configuration
    demo_mode: bool = Field(default=False, description="Enable demo mode for testing without real API keys")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()


# Property platform configurations
PLATFORM_CONFIGS = {
    "facebook": {
        "max_text_length": 2200,
        "image_ratio": "1.91:1",
        "recommended_size": "1200x630",
        "hashtag_limit": 30
    },
    "instagram": {
        "max_text_length": 2200,
        "image_ratio": "1:1",
        "recommended_size": "1080x1080",
        "hashtag_limit": 30
    },
    "linkedin": {
        "max_text_length": 3000,
        "image_ratio": "1.91:1",
        "recommended_size": "1200x627",
        "hashtag_limit": 5
    },
    "twitter": {
        "max_text_length": 280,
        "image_ratio": "16:9",
        "recommended_size": "1200x675",
        "hashtag_limit": 10
    }
}


# UK Property Compliance Rules
UK_COMPLIANCE_RULES = {
    "mandatory_fields": [
        "price",
        "tenure",
        "council_tax_band",
        "epc_rating"
    ],
    "prohibited_terms": [
        "luxury",
        "exclusive",
        "premium",
        "stunning",
        "gorgeous"
    ],
    "discriminatory_terms": [
        "young professionals",
        "mature tenants",
        "no pets",
        "no children",
        "suitable for families"
    ],
    "asa_requirements": [
        "clear_pricing",
        "accurate_description",
        "honest_images",
        "legal_disclaimers"
    ]
}

# Create settings instance
settings = Settings()
