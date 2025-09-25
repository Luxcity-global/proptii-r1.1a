"""
Content Generation Agent for CrewAI
Generates platform-specific marketing content for properties
"""

from typing import Dict, Any, List
from crewai import Agent, Task, Crew
from crewai.tools import BaseTool
from langchain_openai import ChatOpenAI

from models.property_data import PropertyData, PropertyAnalysis, GeneratedContent
from config import settings, PLATFORM_CONFIGS, UK_COMPLIANCE_RULES


class ContentGenerationAgent:
    """Agent for generating platform-specific marketing content"""
    
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4-turbo-preview",
            temperature=0.7,
            api_key=settings.openai_api_key
        )
        
        # Initialize tools
        self.tools = self._initialize_tools()
        
        self.agent = Agent(
            role='Creative Property Marketing Copywriter',
            goal='Create compelling, engaging, and compliant marketing content for UK property listings across multiple social media platforms',
            backstory="""You are a professional copywriter with 12 years of experience in UK property marketing. 
            You have deep expertise in writing property descriptions that comply with ASA regulations while being 
            compelling and engaging. You understand how to adapt content for different social media platforms, 
            from Instagram's visual focus to LinkedIn's professional tone. You excel at highlighting property 
            features in ways that appeal to specific buyer segments while maintaining honesty and compliance. 
            Your content always includes appropriate calls-to-action and platform-specific hashtags that drive engagement.""",
            verbose=settings.crewai_verbose,
            allow_delegation=False,
            llm=self.llm,
            tools=self.tools
        )
    
    def _initialize_tools(self) -> List[BaseTool]:
        """Initialize tools for content generation"""
        tools = []
        
        # Platform optimization tool
        platform_tool = self._create_platform_optimizer_tool()
        tools.append(platform_tool)
        
        # Hashtag generator tool
        hashtag_tool = self._create_hashtag_generator_tool()
        tools.append(hashtag_tool)
        
        # Content compliance checker tool
        compliance_tool = self._create_compliance_checker_tool()
        tools.append(compliance_tool)
        
        return tools
    
    def _create_platform_optimizer_tool(self) -> BaseTool:
        """Create tool for platform-specific content optimization"""
        from crewai.tools import tool
        
        @tool("platform_optimizer")
        def optimize_for_platform(platform: str, content: str, target_audience: List[str]) -> str:
            """Optimize content for specific social media platform and audience."""
            platform_styles = {
                "facebook": {"tone": "Conversational", "format": "Storytelling"},
                "instagram": {"tone": "Visual", "format": "Engaging captions"},
                "linkedin": {"tone": "Professional", "format": "Business-focused"},
                "twitter": {"tone": "Concise", "format": "Short messages"}
            }
            
            style = platform_styles.get(platform, platform_styles["facebook"])
            return f"Platform: {platform}, Tone: {style['tone']}, Format: {style['format']}"
        
        return optimize_for_platform
    
    def _create_hashtag_generator_tool(self) -> BaseTool:
        """Create tool for generating platform-appropriate hashtags"""
        from crewai.tools import tool
        
        @tool("hashtag_generator")
        def generate_hashtags(platform: str, property_type: str, location: str) -> List[str]:
            """Generate platform-appropriate hashtags for property marketing."""
            base_hashtags = ["#property", "#ukproperty", "#realestate"]
            platform_limits = {"facebook": 5, "instagram": 20, "linkedin": 5, "twitter": 3}
            limit = platform_limits.get(platform, 10)
            return base_hashtags[:limit]
        
        return generate_hashtags
    
    def _create_compliance_checker_tool(self) -> BaseTool:
        """Create tool for checking UK property marketing compliance"""
        from crewai.tools import tool
        
        @tool("compliance_checker")
        def check_compliance(content: str, property_data: Dict[str, Any]) -> str:
            """Check content for UK property marketing compliance issues."""
            issues = []
            for term in UK_COMPLIANCE_RULES["prohibited_terms"]:
                if term.lower() in content.lower():
                    issues.append(f"Prohibited term: {term}")
            
            if not issues:
                return "✅ Content appears compliant"
            else:
                return f"⚠️ Issues: {'; '.join(issues)}"
        
        return check_compliance
    
    async def generate_content(
        self, 
        property_data: PropertyData, 
        property_analysis: PropertyAnalysis,
        platforms: List[str]
    ) -> Dict[str, GeneratedContent]:
        """Generate platform-specific content"""
        
        content_by_platform = {}
        
        for platform in platforms:
            if platform in PLATFORM_CONFIGS:
                content = await self._generate_platform_content(
                    property_data, property_analysis, platform
                )
                content_by_platform[platform] = content
        
        return content_by_platform
    
    async def _generate_platform_content(
        self,
        property_data: PropertyData,
        property_analysis: PropertyAnalysis,
        platform: str
    ) -> GeneratedContent:
        """Generate content for a specific platform"""
        
        platform_config = PLATFORM_CONFIGS[platform]
        
        # Create content generation task with tool usage
        content_task = Task(
            description=f"""
            Generate compelling marketing content for a {platform} post about this property using available tools:
            
            Property Details:
            - Address: {property_data.address}
            - Type: {property_data.property_type.value}
            - Price: £{property_data.price:,.0f}
            - Bedrooms: {property_data.bedrooms}
            - Bathrooms: {property_data.bathrooms}
            - Key Features: {', '.join(property_data.features)}
            
            Analysis Insights:
            - Target Audience: {', '.join(property_analysis.target_audience)}
            - Key Selling Points: {', '.join(property_analysis.key_selling_points)}
            - Market Positioning: {property_analysis.market_positioning}
            
            Platform Requirements ({platform}):
            - Max text length: {platform_config['max_text_length']} characters
            - Hashtag limit: {platform_config['hashtag_limit']}
            - Image ratio: {platform_config['image_ratio']}
            
            INSTRUCTIONS:
            1. First, use the platform_optimizer tool to optimize content style for {platform}
            2. Use the hashtag_generator tool to create appropriate hashtags for {platform}
            3. Use the compliance_checker tool to ensure UK compliance
            4. Based on tool insights, create content that includes:
               - Compelling headline (platform-appropriate)
               - Engaging property description
               - Key feature highlights
               - Strong call-to-action
               - Platform-appropriate hashtags
               - Image caption suggestions
               - Visual focus recommendations
            
            UK Compliance Requirements:
            - Include mandatory information: price, tenure, council tax band, EPC rating
            - Avoid prohibited terms: {', '.join(UK_COMPLIANCE_RULES['prohibited_terms'])}
            - No discriminatory language
            - Honest and accurate descriptions
            
            Format for {platform} style and audience expectations.
            """,
            expected_output=f"""
            Complete {platform} marketing content including:
            - Platform optimization insights from tools
            - Platform-optimized headline
            - Engaging description within character limits
            - Key feature highlights
            - Compelling call-to-action
            - Appropriate hashtags from hashtag generator
            - Image captions
            - Visual recommendations
            - Compliance validation results
            - UK regulations compliance
            """,
            agent=self.agent
        )
        
        # Create crew and execute
        crew = Crew(
            agents=[self.agent],
            tasks=[content_task],
            verbose=settings.crewai_verbose
        )
        
        # Execute content generation
        result = crew.kickoff()
        
        # Parse and structure the result
        content = self._parse_content_result(result, property_data.property_id, platform)
        
        return content
    
    def _parse_content_result(
        self, 
        result: str, 
        property_id: str, 
        platform: str
    ) -> GeneratedContent:
        """Parse the crew result into structured GeneratedContent"""
        
        # For now, return structured content based on the text result
        # In production, you'd parse the LLM output more carefully
        
        return GeneratedContent(
            property_id=property_id,
            platform=platform,
            headline=self._extract_headline(result),
            description=self._extract_description(result),
            key_features=self._extract_key_features(result),
            call_to_action=self._extract_call_to_action(result),
            hashtags=self._extract_hashtags(result),
            image_captions=self._extract_image_captions(result),
            visual_focus=self._extract_visual_focus(result),
            tone=self._extract_tone(result),
            target_emotion=self._extract_target_emotion(result)
        )
    
    def _extract_headline(self, result: str) -> str:
        """Extract headline from content result"""
        # Simple extraction - look for headline patterns
        lines = result.split('\n')
        for line in lines:
            if line.strip() and len(line.strip()) < 100:
                # Likely a headline if it's short and starts with a capital
                if line.strip()[0].isupper():
                    return line.strip()
        
        return "Beautiful Property Available"
    
    def _extract_description(self, result: str) -> str:
        """Extract main description from content result"""
        # Simple extraction - find the main descriptive text
        lines = result.split('\n')
        description_parts = []
        
        for line in lines:
            line = line.strip()
            if line and len(line) > 20 and not line.startswith('#'):
                # Likely part of description if it's substantial text
                description_parts.append(line)
        
        return ' '.join(description_parts[:3]) or "Well-presented property with great potential"
    
    def _extract_key_features(self, result: str) -> List[str]:
        """Extract key features from content result"""
        features = []
        
        # Look for feature-related keywords
        feature_keywords = [
            "bedroom", "bathroom", "garden", "parking", "modern", 
            "spacious", "kitchen", "location", "transport"
        ]
        
        for keyword in feature_keywords:
            if keyword in result.lower():
                features.append(f"Excellent {keyword}")
        
        return features[:5] or ["Great features throughout"]
    
    def _extract_call_to_action(self, result: str) -> str:
        """Extract call to action from content result"""
        # Look for common CTA patterns
        cta_patterns = [
            "contact", "call", "viewing", "inquiry", "enquire", 
            "call today", "book viewing", "get in touch"
        ]
        
        for pattern in cta_patterns:
            if pattern in result.lower():
                return f"Contact us to arrange a {pattern}"
        
        return "Contact us for more information"
    
    def _extract_hashtags(self, result: str) -> List[str]:
        """Extract hashtags from content result"""
        hashtags = []
        lines = result.split('\n')
        
        for line in lines:
            if line.strip().startswith('#'):
                hashtags.append(line.strip())
        
        # Add some default property hashtags if none found
        if not hashtags:
            hashtags = [
                "#property", "#ukproperty", "#realestate", 
                "#homes", "#propertyforsale"
            ]
        
        return hashtags[:10]  # Limit to reasonable number
    
    def _extract_image_captions(self, result: str) -> List[str]:
        """Extract image captions from content result"""
        captions = []
        
        # Simple extraction - look for image-related text
        if "living room" in result.lower():
            captions.append("Spacious living area")
        if "kitchen" in result.lower():
            captions.append("Modern kitchen")
        if "bedroom" in result.lower():
            captions.append("Comfortable bedroom")
        if "garden" in result.lower():
            captions.append("Private garden")
        
        return captions or ["Property interior", "External view"]
    
    def _extract_visual_focus(self, result: str) -> str:
        """Extract visual focus recommendations from content result"""
        if "modern" in result.lower():
            return "Modern interior features"
        elif "garden" in result.lower():
            return "Outdoor space and garden"
        elif "kitchen" in result.lower():
            return "Kitchen and living areas"
        else:
            return "Overall property appeal"
    
    def _extract_tone(self, result: str) -> str:
        """Extract content tone from result"""
        if "stunning" in result.lower() or "gorgeous" in result.lower():
            return "Enthusiastic"
        elif "professional" in result.lower():
            return "Professional"
        else:
            return "Friendly and informative"
    
    def _extract_target_emotion(self, result: str) -> str:
        """Extract target emotional response from result"""
        if "investment" in result.lower():
            return "Confidence and opportunity"
        elif "family" in result.lower():
            return "Security and belonging"
        else:
            return "Excitement and interest"


