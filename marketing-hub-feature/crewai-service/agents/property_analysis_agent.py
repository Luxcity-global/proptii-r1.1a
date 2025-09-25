"""
Property Analysis Agent for CrewAI
Analyzes property data and market context to identify key selling points
"""

from typing import Dict, Any, List
from crewai import Agent, Task, Crew
from crewai.tools import BaseTool
from langchain_openai import ChatOpenAI

from models.property_data import PropertyData, PropertyAnalysis
from config import settings, PLATFORM_CONFIGS


class PropertyAnalysisAgent:
    """Agent for analyzing property data and market context"""
    
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4-turbo-preview",
            temperature=0.3,
            api_key=settings.openai_api_key
        )
        
        # Initialize tools
        self.tools = self._initialize_tools()
        
        self.agent = Agent(
            role='UK Property Marketing Analyst',
            goal='Analyze property data to extract key selling points, identify target audiences, and provide market positioning insights for effective marketing',
            backstory="""You are an expert UK property marketing analyst with over 15 years of experience in the British real estate market. 
            You have deep knowledge of UK property types, market trends, buyer psychology, and regional variations. 
            You excel at identifying what makes properties appealing to different buyer segments and positioning properties 
            effectively in competitive markets. You understand UK property regulations, EPC ratings, council tax implications, 
            and how these factors influence buyer decisions. Your analysis always considers local market conditions, 
            transport links, amenities, and investment potential.""",
            verbose=settings.crewai_verbose,
            allow_delegation=False,
            llm=self.llm,
            tools=self.tools
        )
    
    def _initialize_tools(self) -> List[BaseTool]:
        """Initialize tools for property analysis"""
        tools = []
        
        # Market data tool
        market_data_tool = self._create_market_data_tool()
        tools.append(market_data_tool)
        
        # Location analysis tool
        location_tool = self._create_location_analysis_tool()
        tools.append(location_tool)
        
        # Investment analysis tool
        investment_tool = self._create_investment_analysis_tool()
        tools.append(investment_tool)
        
        return tools
    
    def _create_market_data_tool(self) -> BaseTool:
        """Create tool for market data analysis"""
        from crewai.tools import tool
        
        @tool("market_data_analyzer")
        def analyze_market_data(postcode: str, property_type: str, price: float) -> str:
            """Analyze local market data for the property's postcode area.
            
            Args:
                postcode: UK postcode for market analysis
                property_type: Type of property (flat, house, etc.)
                price: Property asking price
                
            Returns:
                Market analysis including average prices, market trends, and competition
            """
            # In a real implementation, this would query market data APIs
            # For now, return mock analysis based on postcode patterns
            if postcode.startswith('SW'):
                return f"Prime London location with average {property_type} prices of £800k-£1.2M. Strong market with consistent demand from professionals and international buyers."
            elif postcode.startswith('NW'):
                return f"North London area with average {property_type} prices of £600k-£900k. Popular with families due to good schools and transport links."
            elif postcode.startswith('E'):
                return f"East London location experiencing rapid development. Average {property_type} prices of £400k-£700k with strong investment potential."
            else:
                return f"UK property market analysis for {postcode}. Local market conditions vary, recommend detailed local research."
        
        return analyze_market_data
    
    def _create_location_analysis_tool(self) -> BaseTool:
        """Create tool for location analysis"""
        from crewai.tools import tool
        
        @tool("location_analyzer")
        def analyze_location(postcode: str, transport_links: List[str], amenities: List[str]) -> str:
            """Analyze location benefits and appeal factors.
            
            Args:
                postcode: UK postcode for location analysis
                transport_links: Available transport connections
                amenities: Local amenities and services
                
            Returns:
                Location analysis including transport, amenities, and lifestyle benefits
            """
            analysis_parts = []
            
            # Transport analysis
            if any('underground' in link.lower() or 'tube' in link.lower() for link in transport_links):
                analysis_parts.append("Excellent underground connectivity for city commuting")
            if any('train' in link.lower() for link in transport_links):
                analysis_parts.append("Good rail connections for wider travel")
            if any('bus' in link.lower() for link in transport_links):
                analysis_parts.append("Comprehensive bus network for local travel")
            
            # Amenities analysis
            if any('school' in amenity.lower() for amenity in amenities):
                analysis_parts.append("Family-friendly location with good schools")
            if any('park' in amenity.lower() or 'green' in amenity.lower() for amenity in amenities):
                analysis_parts.append("Access to green spaces and recreational areas")
            if any('shop' in amenity.lower() or 'retail' in amenity.lower() for amenity in amenities):
                analysis_parts.append("Convenient shopping and retail options")
            
            return "; ".join(analysis_parts) if analysis_parts else "Standard residential location"
        
        return analyze_location
    
    def _create_investment_analysis_tool(self) -> BaseTool:
        """Create tool for investment analysis"""
        from crewai.tools import tool
        
        @tool("investment_analyzer")
        def analyze_investment_potential(property_type: str, price: float, location: str, features: List[str]) -> str:
            """Analyze property investment potential and rental yields.
            
            Args:
                property_type: Type of property
                price: Property price
                location: Property location/area
                features: Property features and amenities
                
            Returns:
                Investment analysis including rental potential and market positioning
            """
            # Basic investment analysis based on property characteristics
            investment_score = 0
            factors = []
            
            # Price analysis
            if price < 500000:
                investment_score += 30
                factors.append("Competitive entry price for investors")
            elif price < 800000:
                investment_score += 20
                factors.append("Mid-market price point with good potential")
            
            # Property type analysis
            if property_type in ['flat', 'studio']:
                investment_score += 25
                factors.append("Popular rental property type")
            elif property_type == 'house':
                investment_score += 15
                factors.append("Family rental market potential")
            
            # Features analysis
            if 'parking' in features:
                investment_score += 10
                factors.append("Parking adds rental value")
            if 'garden' in features:
                investment_score += 10
                factors.append("Outdoor space increases appeal")
            if 'modern' in features:
                investment_score += 15
                factors.append("Modern features attract quality tenants")
            
            if investment_score >= 70:
                return f"Strong investment potential (Score: {investment_score}/100). " + "; ".join(factors)
            elif investment_score >= 50:
                return f"Good investment potential (Score: {investment_score}/100). " + "; ".join(factors)
            else:
                return f"Moderate investment potential (Score: {investment_score}/100). " + "; ".join(factors)
        
        return analyze_investment_potential
    
    async def analyze_property(self, property_data: PropertyData) -> PropertyAnalysis:
        """Analyze property data and return comprehensive analysis"""
        
        # Create analysis task
        analysis_task = Task(
            description=f"""
            Analyze the following property data and provide comprehensive marketing insights using available tools:
            
            Property Details:
            - Address: {property_data.address}
            - Postcode: {property_data.postcode}
            - Type: {property_data.property_type.value}
            - Price: £{property_data.price:,.0f}
            - Bedrooms: {property_data.bedrooms}
            - Bathrooms: {property_data.bathrooms}
            - Tenure: {property_data.tenure.value}
            - EPC Rating: {property_data.epc_rating}
            - Council Tax Band: {property_data.council_tax_band}
            
            Features: {', '.join(property_data.features)}
            Location Features: {', '.join(property_data.location_features)}
            Transport Links: {', '.join(property_data.transport_links)}
            
            INSTRUCTIONS:
            1. First, use the market_data_analyzer tool to analyze local market conditions for postcode {property_data.postcode}
            2. Use the location_analyzer tool to assess location benefits and transport/amenity appeal
            3. Use the investment_analyzer tool to evaluate investment potential
            4. Based on all tool insights, provide:
               - Target Audiences: Identify 2-3 primary buyer segments (e.g., first-time buyers, families, professionals, investors)
               - Key Selling Points: Extract 5-7 most compelling selling points
               - Market Positioning: Define how to position this property in the market
               - Competitive Advantages: Identify unique advantages over similar properties
               - Location Benefits: Highlight location-specific advantages
               - Investment Potential: Assess investment appeal if applicable
               - Family Appeal: Factors that appeal to families
               - Professional Appeal: Factors that appeal to working professionals
            
            Format your response as a structured analysis with clear sections.
            """,
            expected_output="""
            A comprehensive property analysis including:
            - Market data insights from tools
            - Target audiences with reasoning
            - Key selling points prioritized by impact
            - Market positioning strategy
            - Competitive advantages
            - Location benefits
            - Investment potential assessment
            - Family and professional appeal factors
            """,
            agent=self.agent
        )
        
        # Create crew and execute
        crew = Crew(
            agents=[self.agent],
            tasks=[analysis_task],
            verbose=settings.crewai_verbose
        )
        
        # Execute analysis
        result = crew.kickoff()
        
        # Parse and structure the result
        analysis = self._parse_analysis_result(result, property_data.property_id)
        
        return analysis
    
    def _parse_analysis_result(self, result: str, property_id: str) -> PropertyAnalysis:
        """Parse the crew result into structured PropertyAnalysis"""
        
        # For now, return a structured analysis based on the text result
        # In a production system, you'd parse the LLM output more carefully
        
        return PropertyAnalysis(
            property_id=property_id,
            target_audience=self._extract_target_audiences(result),
            key_selling_points=self._extract_selling_points(result),
            market_positioning=self._extract_market_positioning(result),
            competitive_advantages=self._extract_competitive_advantages(result),
            location_benefits=self._extract_location_benefits(result),
            investment_potential=self._extract_investment_potential(result),
            family_appeal=self._extract_family_appeal(result),
            professional_appeal=self._extract_professional_appeal(result)
        )
    
    def _extract_target_audiences(self, result: str) -> List[str]:
        """Extract target audiences from analysis result"""
        # Simple extraction - in production, use more sophisticated parsing
        audiences = []
        if "first-time buyer" in result.lower():
            audiences.append("First-time buyers")
        if "family" in result.lower():
            audiences.append("Families")
        if "professional" in result.lower():
            audiences.append("Working professionals")
        if "investor" in result.lower():
            audiences.append("Property investors")
        
        return audiences or ["General buyers"]
    
    def _extract_selling_points(self, result: str) -> List[str]:
        """Extract key selling points from analysis result"""
        # Simple extraction - in production, use more sophisticated parsing
        points = []
        
        # Common selling points to look for
        selling_point_keywords = [
            "location", "transport", "amenities", "features", "garden", 
            "parking", "modern", "spacious", "investment", "potential"
        ]
        
        for keyword in selling_point_keywords:
            if keyword in result.lower():
                points.append(f"Strong {keyword} appeal")
        
        return points[:7] or ["Well-positioned property"]
    
    def _extract_market_positioning(self, result: str) -> str:
        """Extract market positioning from analysis result"""
        if "luxury" in result.lower():
            return "Premium market positioning"
        elif "affordable" in result.lower():
            return "Value-focused positioning"
        else:
            return "Competitive market positioning"
    
    def _extract_competitive_advantages(self, result: str) -> List[str]:
        """Extract competitive advantages from analysis result"""
        advantages = []
        if "unique" in result.lower():
            advantages.append("Unique features")
        if "location" in result.lower():
            advantages.append("Prime location")
        if "modern" in result.lower():
            advantages.append("Modern amenities")
        
        return advantages or ["Good value proposition"]
    
    def _extract_location_benefits(self, result: str) -> List[str]:
        """Extract location benefits from analysis result"""
        benefits = []
        if "transport" in result.lower():
            benefits.append("Excellent transport links")
        if "amenities" in result.lower():
            benefits.append("Local amenities")
        if "school" in result.lower():
            benefits.append("Good schools nearby")
        
        return benefits or ["Convenient location"]
    
    def _extract_investment_potential(self, result: str) -> str:
        """Extract investment potential from analysis result"""
        if "rental" in result.lower() or "yield" in result.lower():
            return "Strong rental investment potential"
        else:
            return "Primary residence focused"
    
    def _extract_family_appeal(self, result: str) -> Dict[str, Any]:
        """Extract family appeal factors from analysis result"""
        appeal = {}
        if "garden" in result.lower():
            appeal["garden"] = True
        if "school" in result.lower():
            appeal["schools"] = True
        if "bedroom" in result.lower() and "3" in result:
            appeal["bedrooms"] = "Suitable for families"
        
        return appeal or {"general": "Family-friendly features"}
    
    def _extract_professional_appeal(self, result: str) -> Dict[str, Any]:
        """Extract professional appeal factors from analysis result"""
        appeal = {}
        if "transport" in result.lower():
            appeal["commute"] = "Easy commute to city"
        if "modern" in result.lower():
            appeal["style"] = "Modern professional aesthetic"
        if "parking" in result.lower():
            appeal["parking"] = "Convenient parking"
        
        return appeal or {"general": "Professional lifestyle suitable"}

