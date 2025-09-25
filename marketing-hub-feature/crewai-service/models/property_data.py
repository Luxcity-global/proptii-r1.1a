"""
Property data models for CrewAI agents
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class PropertyType(str, Enum):
    """Property types"""
    FLAT = "flat"
    HOUSE = "house"
    BUNGALOW = "bungalow"
    TERRACED = "terraced"
    DETACHED = "detached"
    SEMI_DETACHED = "semi_detached"
    STUDIO = "studio"
    PENTHOUSE = "penthouse"


class TenureType(str, Enum):
    """Tenure types"""
    FREEHOLD = "freehold"
    LEASEHOLD = "leasehold"
    SHARED_FREEHOLD = "shared_freehold"


class PropertyData(BaseModel):
    """Property data model"""
    
    # Basic Information
    property_id: str = Field(..., description="Unique property identifier")
    address: str = Field(..., description="Full property address")
    postcode: str = Field(..., description="UK postcode")
    property_type: PropertyType = Field(..., description="Type of property")
    
    # Pricing
    price: float = Field(..., description="Property price")
    price_type: str = Field(default="fixed", description="Price type (fixed, guide, offers)")
    
    # Tenure
    tenure: TenureType = Field(..., description="Property tenure")
    
    # Key Details
    bedrooms: int = Field(..., description="Number of bedrooms")
    bathrooms: int = Field(..., description="Number of bathrooms")
    reception_rooms: int = Field(default=0, description="Number of reception rooms")
    total_rooms: int = Field(default=0, description="Total number of rooms")
    
    # Size Information
    floor_area: Optional[float] = Field(default=None, description="Floor area in sq ft")
    
    # Property Features
    features: List[str] = Field(default_factory=list, description="Property features")
    garden: bool = Field(default=False, description="Has garden")
    parking: bool = Field(default=False, description="Has parking")
    balcony: bool = Field(default=False, description="Has balcony")
    fireplace: bool = Field(default=False, description="Has fireplace")
    
    # Energy & Compliance
    epc_rating: str = Field(..., description="EPC rating (A-G)")
    council_tax_band: str = Field(..., description="Council tax band")
    
    # Location Context
    location_features: List[str] = Field(default_factory=list, description="Nearby amenities")
    transport_links: List[str] = Field(default_factory=list, description="Transport connections")
    
    # Images
    images: List[Dict[str, Any]] = Field(default_factory=list, description="Property images")
    
    # Agent Information
    agent_name: Optional[str] = Field(default=None, description="Estate agent name")
    agent_phone: Optional[str] = Field(default=None, description="Agent phone number")
    agent_email: Optional[str] = Field(default=None, description="Agent email")
    
    # Market Context
    market_notes: Optional[str] = Field(default=None, description="Market context notes")
    selling_points: List[str] = Field(default_factory=list, description="Key selling points")


class PropertyAnalysis(BaseModel):
    """Property analysis result"""
    
    property_id: str
    target_audience: List[str] = Field(description="Identified target audiences")
    key_selling_points: List[str] = Field(description="Primary selling points")
    market_positioning: str = Field(description="Market positioning strategy")
    competitive_advantages: List[str] = Field(description="Competitive advantages")
    location_benefits: List[str] = Field(description="Location-specific benefits")
    investment_potential: Optional[str] = Field(description="Investment potential analysis")
    family_appeal: Dict[str, Any] = Field(description="Family appeal factors")
    professional_appeal: Dict[str, Any] = Field(description="Professional appeal factors")


class GeneratedContent(BaseModel):
    """Generated marketing content"""
    
    property_id: str
    platform: str
    
    # Content Elements
    headline: str = Field(description="Compelling headline")
    description: str = Field(description="Property description")
    key_features: List[str] = Field(description="Key feature highlights")
    call_to_action: str = Field(description="Call to action")
    hashtags: List[str] = Field(description="Platform-appropriate hashtags")
    
    # Visual Recommendations
    image_captions: List[str] = Field(description="Image captions")
    visual_focus: str = Field(description="Visual focus recommendations")
    
    # Tone and Style
    tone: str = Field(description="Content tone")
    target_emotion: str = Field(description="Target emotional response")


class ComplianceReport(BaseModel):
    """Compliance validation report"""
    
    property_id: str
    is_compliant: bool
    compliance_score: float = Field(ge=0, le=100, description="Compliance score")
    
    # Validation Results
    mandatory_fields_present: Dict[str, bool] = Field(description="Mandatory fields check")
    prohibited_terms_found: List[str] = Field(description="Prohibited terms detected")
    discriminatory_language: List[str] = Field(description="Discriminatory language found")
    asa_violations: List[str] = Field(description="ASA regulation violations")
    
    # Recommendations
    recommendations: List[str] = Field(description="Compliance improvement recommendations")
    required_changes: List[str] = Field(description="Required changes for compliance")


class PropertyMarketingResult(BaseModel):
    """Complete property marketing result"""
    
    property_id: str
    platforms: List[str]
    
    # Analysis Results
    property_analysis: PropertyAnalysis
    
    # Generated Content
    content_by_platform: Dict[str, GeneratedContent]
    
    # Compliance
    compliance_report: ComplianceReport
    
    # Metadata
    generation_timestamp: str
    processing_time: float
    agent_versions: Dict[str, str]
