"""
Property Marketing Crew - Main CrewAI orchestrator
Coordinates all agents for complete property marketing workflow
"""

import asyncio
from typing import Dict, Any, List, Callable
from datetime import datetime

from models.property_data import PropertyData, PropertyMarketingResult
from agents.property_analysis_agent import PropertyAnalysisAgent
from agents.content_generation_agent import ContentGenerationAgent
from agents.compliance_validation_agent import ComplianceValidationAgent
from config import settings


class PropertyMarketingCrew:
    """Main crew orchestrator for property marketing workflow"""
    
    def __init__(self):
        self.property_analyst = PropertyAnalysisAgent()
        self.content_generator = ContentGenerationAgent()
        self.compliance_checker = ComplianceValidationAgent()
        
        self.initialized = False
    
    async def initialize(self):
        """Initialize the crew"""
        if not self.initialized:
            # Initialize all agents
            await asyncio.gather(
                self.property_analyst.__init__(),
                self.content_generator.__init__(),
                self.compliance_checker.__init__()
            )
            self.initialized = True
    
    async def process_property_marketing(
        self,
        property_data: PropertyData,
        platforms: List[str] = None,
        progress_callback: Callable[[int, str], None] = None
    ) -> PropertyMarketingResult:
        """Process complete property marketing workflow"""
        
        if not self.initialized:
            await self.initialize()
        
        start_time = datetime.now()
        
        if platforms is None:
            platforms = ["facebook", "instagram", "linkedin", "twitter"]
        
        try:
            # Step 1: Property Analysis
            if progress_callback:
                await progress_callback(10, "Analyzing property data and market context...")
            
            property_analysis = await self.property_analyst.analyze_property(property_data)
            
            # Step 2: Content Generation
            if progress_callback:
                await progress_callback(40, "Generating platform-specific marketing content...")
            
            content_by_platform = await self.content_generator.generate_content(
                property_data, property_analysis, platforms
            )
            
            # Step 3: Compliance Validation
            if progress_callback:
                await progress_callback(70, "Validating content compliance with UK regulations...")
            
            compliance_report = await self.compliance_checker.validate_compliance(
                property_data, content_by_platform
            )
            
            # Step 4: Final Processing
            if progress_callback:
                await progress_callback(90, "Finalizing marketing package...")
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # Create final result
            result = PropertyMarketingResult(
                property_id=property_data.property_id,
                platforms=platforms,
                property_analysis=property_analysis,
                content_by_platform=content_by_platform,
                compliance_report=compliance_report,
                generation_timestamp=datetime.now().isoformat(),
                processing_time=processing_time,
                agent_versions={
                    "property_analysis": "1.0.0",
                    "content_generation": "1.0.0",
                    "compliance_validation": "1.0.0"
                }
            )
            
            if progress_callback:
                await progress_callback(100, "Property marketing package complete!")
            
            return result
            
        except Exception as e:
            # Handle errors gracefully
            if progress_callback:
                await progress_callback(0, f"Error processing property marketing: {str(e)}")
            raise e
    
    async def optimize_content_for_platform(
        self,
        property_data: PropertyData,
        platform: str,
        existing_content: str = None
    ) -> Dict[str, Any]:
        """Optimize existing content for a specific platform"""
        
        if not self.initialized:
            await self.initialize()
        
        try:
            # Analyze property first
            property_analysis = await self.property_analyst.analyze_property(property_data)
            
            # Generate optimized content for platform
            content_by_platform = await self.content_generator.generate_content(
                property_data, property_analysis, [platform]
            )
            
            # Validate compliance
            compliance_report = await self.compliance_checker.validate_compliance(
                property_data, content_by_platform
            )
            
            return {
                "platform": platform,
                "content": content_by_platform[platform],
                "compliance": compliance_report,
                "optimization_notes": f"Content optimized for {platform} audience and format"
            }
            
        except Exception as e:
            return {
                "platform": platform,
                "error": str(e),
                "content": None,
                "compliance": None
            }
    
    async def validate_existing_content(
        self,
        property_data: PropertyData,
        content_text: str
    ) -> Dict[str, Any]:
        """Validate existing content for compliance"""
        
        if not self.initialized:
            await self.initialize()
        
        try:
            # Create a mock GeneratedContent object for validation
            mock_content = {
                "facebook": {
                    "headline": content_text[:100],
                    "description": content_text,
                    "key_features": [],
                    "call_to_action": "Contact us",
                    "hashtags": [],
                    "image_captions": [],
                    "visual_focus": "General",
                    "tone": "Informative",
                    "target_emotion": "Interest"
                }
            }
            
            # Validate compliance
            compliance_report = await self.compliance_checker.validate_compliance(
                property_data, mock_content
            )
            
            return {
                "is_compliant": compliance_report.is_compliant,
                "compliance_score": compliance_report.compliance_score,
                "recommendations": compliance_report.recommendations,
                "required_changes": compliance_report.required_changes,
                "violations": {
                    "prohibited_terms": compliance_report.prohibited_terms_found,
                    "discriminatory_language": compliance_report.discriminatory_language,
                    "asa_violations": compliance_report.asa_violations
                }
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "is_compliant": False,
                "compliance_score": 0
            }
    
    async def get_agent_capabilities(self) -> Dict[str, Any]:
        """Get information about crew capabilities"""
        return {
            "crew_name": "Property Marketing Crew",
            "version": "1.0.0",
            "agents": {
                "property_analysis": {
                    "role": "UK Property Marketing Analyst",
                    "capabilities": [
                        "Property data analysis",
                        "Market positioning",
                        "Target audience identification",
                        "Competitive advantage assessment"
                    ]
                },
                "content_generation": {
                    "role": "Creative Property Marketing Copywriter",
                    "capabilities": [
                        "Platform-specific content creation",
                        "Headline and description writing",
                        "Hashtag optimization",
                        "Call-to-action creation"
                    ]
                },
                "compliance_validation": {
                    "role": "ASA Compliance Validation Specialist",
                    "capabilities": [
                        "UK regulation compliance checking",
                        "ASA guideline validation",
                        "Anti-discrimination verification",
                        "Mandatory information validation"
                    ]
                }
            },
            "supported_platforms": ["facebook", "instagram", "linkedin", "twitter"],
            "compliance_standards": ["ASA", "UK Property Law", "Anti-discrimination"]
        }
