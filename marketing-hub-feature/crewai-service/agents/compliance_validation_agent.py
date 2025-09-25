"""
Compliance Validation Agent for CrewAI
Validates property marketing content against UK regulations
"""

from typing import Dict, Any, List
from crewai import Agent, Task, Crew
from crewai.tools import BaseTool
from langchain_openai import ChatOpenAI

from models.property_data import PropertyData, GeneratedContent, ComplianceReport
from config import settings, UK_COMPLIANCE_RULES


class ComplianceValidationAgent:
    """Agent for validating property marketing content compliance"""
    
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4-turbo-preview",
            temperature=0.1,  # Low temperature for consistent compliance checking
            api_key=settings.openai_api_key
        )
        
        # Initialize tools
        self.tools = self._initialize_tools()
        
        self.agent = Agent(
            role='ASA Compliance Validation Specialist',
            goal='Ensure all property marketing content strictly adheres to UK property advertising regulations, ASA guidelines, and anti-discrimination laws',
            backstory="""You are a meticulous compliance specialist with 10 years of experience in UK property advertising regulations. 
            You have expert knowledge of ASA (Advertising Standards Authority) guidelines, UK property advertising laws, 
            anti-discrimination legislation, and consumer protection regulations. You understand the mandatory requirements 
            for property listings, prohibited terms, and the legal implications of misleading advertising. 
            Your role is to ensure all marketing content is honest, accurate, and compliant while protecting 
            both the advertiser and potential buyers from legal issues.""",
            verbose=settings.crewai_verbose,
            allow_delegation=False,
            llm=self.llm,
            tools=self.tools
        )
    
    def _initialize_tools(self) -> List[BaseTool]:
        """Initialize tools for compliance validation"""
        tools = []
        
        # ASA regulation lookup tool
        asa_tool = self._create_asa_regulation_lookup_tool()
        tools.append(asa_tool)
        
        # Prohibited terms checker tool
        prohibited_tool = self._create_prohibited_terms_checker_tool()
        tools.append(prohibited_tool)
        
        # Mandatory fields validator tool
        mandatory_tool = self._create_mandatory_fields_validator_tool()
        tools.append(mandatory_tool)
        
        # Discrimination checker tool
        discrimination_tool = self._create_discrimination_checker_tool()
        tools.append(discrimination_tool)
        
        return tools
    
    def _create_asa_regulation_lookup_tool(self) -> BaseTool:
        """Create tool for ASA regulation lookups"""
        from crewai.tools import tool
        
        @tool("asa_regulation_lookup")
        def lookup_asa_regulations(content_type: str, issue_type: str) -> str:
            """Look up relevant ASA regulations for property marketing content.
            
            Args:
                content_type: Type of content (property listing, social media post, etc.)
                issue_type: Specific issue to check (misleading claims, accuracy, etc.)
                
            Returns:
                Relevant ASA regulations and guidelines
            """
            asa_guidelines = {
                "misleading_claims": "ASA CAP Code 3.1: Advertisements must not materially mislead or be likely to do so. All claims must be substantiated and truthful.",
                "accuracy": "ASA CAP Code 3.2: Advertisements must be prepared with a sense of responsibility to consumers and society.",
                "property_listings": "ASA CAP Code 11: Property advertisements must include all material information and avoid misleading claims about features or benefits.",
                "pricing": "ASA CAP Code 3.17: Price claims must be clear and not misleading. All additional costs must be clearly disclosed.",
                "discrimination": "ASA CAP Code 4.1: Advertisements must not contain anything that is likely to cause serious or widespread offence.",
                "superlatives": "ASA CAP Code 3.7: Advertisements must not exaggerate the capability or performance of a product or service."
            }
            
            return asa_guidelines.get(issue_type, "General ASA guidelines apply. Ensure content is truthful, not misleading, and socially responsible.")
        
        return lookup_asa_regulations
    
    def _create_prohibited_terms_checker_tool(self) -> BaseTool:
        """Create tool for checking prohibited terms"""
        from crewai.tools import tool
        
        @tool("prohibited_terms_checker")
        def check_prohibited_terms(content: str) -> str:
            """Check content for prohibited terms in UK property advertising.
            
            Args:
                content: Content to check for prohibited terms
                
            Returns:
                Report of prohibited terms found and recommendations
            """
            prohibited_found = []
            recommendations = []
            
            for term in UK_COMPLIANCE_RULES["prohibited_terms"]:
                if term.lower() in content.lower():
                    prohibited_found.append(term)
                    recommendations.append(f"Replace '{term}' with more accurate, factual language")
            
            if not prohibited_found:
                return "✅ No prohibited terms found in content"
            else:
                report = f"⚠️ Prohibited terms found: {', '.join(prohibited_found)}\n"
                report += "Recommendations:\n"
                for rec in recommendations:
                    report += f"- {rec}\n"
                return report
        
        return check_prohibited_terms
    
    def _create_mandatory_fields_validator_tool(self) -> BaseTool:
        """Create tool for validating mandatory fields"""
        from crewai.tools import tool
        
        @tool("mandatory_fields_validator")
        def validate_mandatory_fields(property_data: Dict[str, Any], content: str) -> str:
            """Validate that all mandatory property information is included in content.
            
            Args:
                property_data: Property information
                content: Marketing content to validate
                
            Returns:
                Report of mandatory fields present/missing
            """
            mandatory_fields = UK_COMPLIANCE_RULES["mandatory_fields"]
            field_status = {}
            missing_fields = []
            
            for field in mandatory_fields:
                if field in property_data and property_data[field]:
                    # Check if field is mentioned in content
                    if field == "price" and "£" in content or "price" in content.lower():
                        field_status[field] = True
                    elif field == "tenure" and field in content.lower():
                        field_status[field] = True
                    elif field == "council_tax_band" and ("council" in content.lower() and "tax" in content.lower()):
                        field_status[field] = True
                    elif field == "epc_rating" and "epc" in content.lower():
                        field_status[field] = True
                    else:
                        field_status[field] = False
                        missing_fields.append(field)
                else:
                    field_status[field] = False
                    missing_fields.append(field)
            
            if not missing_fields:
                return "✅ All mandatory fields are present in content"
            else:
                return f"⚠️ Missing mandatory fields: {', '.join(missing_fields)}. Include these in your marketing content."
        
        return validate_mandatory_fields
    
    def _create_discrimination_checker_tool(self) -> BaseTool:
        """Create tool for checking discriminatory language"""
        from crewai.tools import tool
        
        @tool("discrimination_checker")
        def check_discriminatory_language(content: str) -> str:
            """Check content for potentially discriminatory language.
            
            Args:
                content: Content to check for discriminatory language
                
            Returns:
                Report of discriminatory language found and recommendations
            """
            discriminatory_found = []
            recommendations = []
            
            for term in UK_COMPLIANCE_RULES["discriminatory_terms"]:
                if term.lower() in content.lower():
                    discriminatory_found.append(term)
                    recommendations.append(f"Remove discriminatory language: '{term}' - use inclusive language instead")
            
            # Additional checks for common discriminatory patterns
            discriminatory_patterns = [
                "no pets", "no children", "young professionals only", "mature tenants preferred",
                "suitable for families", "couples only", "professionals only"
            ]
            
            for pattern in discriminatory_patterns:
                if pattern in content.lower():
                    discriminatory_found.append(pattern)
                    recommendations.append(f"Remove discriminatory preference: '{pattern}'")
            
            if not discriminatory_found:
                return "✅ No discriminatory language found in content"
            else:
                report = f"⚠️ Discriminatory language found: {', '.join(discriminatory_found)}\n"
                report += "Recommendations:\n"
                for rec in recommendations:
                    report += f"- {rec}\n"
                return report
        
        return check_discriminatory_language
    
    async def validate_compliance(
        self, 
        property_data: PropertyData,
        content_by_platform: Dict[str, GeneratedContent]
    ) -> ComplianceReport:
        """Validate compliance for all generated content"""
        
        # Create compliance validation task with tool usage
        compliance_task = Task(
            description=f"""
            Validate the following property marketing content against UK compliance regulations using available tools:
            
            Property Data:
            - Address: {property_data.address}
            - Price: £{property_data.price:,.0f}
            - Tenure: {property_data.tenure.value}
            - EPC Rating: {property_data.epc_rating}
            - Council Tax Band: {property_data.council_tax_band}
            
            Generated Content by Platform:
            {self._format_content_for_validation(content_by_platform)}
            
            INSTRUCTIONS:
            1. First, use the asa_regulation_lookup tool to check relevant ASA regulations for property listings
            2. Use the prohibited_terms_checker tool to scan all content for prohibited terms
            3. Use the mandatory_fields_validator tool to verify all mandatory information is included
            4. Use the discrimination_checker tool to identify any discriminatory language
            5. Based on all tool insights, provide comprehensive compliance validation:
               - Overall compliance score (0-100)
               - Mandatory fields check (which are present/missing)
               - Prohibited terms found (if any)
               - Discriminatory language detected (if any)
               - ASA violations identified
               - Recommendations for improvement
               - Required changes for compliance
            
            UK Compliance Requirements to Check:
            
            1. Mandatory Information:
            - Price must be clearly stated
            - Tenure information included
            - Council tax band mentioned
            - EPC rating disclosed
            
            2. Prohibited Terms (ASA Guidelines):
            - Avoid: {', '.join(UK_COMPLIANCE_RULES['prohibited_terms'])}
            - No misleading superlatives
            - No unsubstantiated claims
            
            3. Anti-Discrimination:
            - No discriminatory language: {', '.join(UK_COMPLIANCE_RULES['discriminatory_terms'])}
            - No targeting specific demographics inappropriately
            - Equal opportunity language
            
            4. Accuracy Requirements:
            - Honest property descriptions
            - Accurate images (if mentioned)
            - Truthful feature claims
            
            Be thorough and specific in your analysis using all available tools.
            """,
            expected_output="""
            Comprehensive compliance validation report including:
            - ASA regulation compliance insights from tools
            - Compliance score and overall assessment
            - Detailed breakdown of mandatory information
            - List of any violations found
            - Prohibited terms analysis results
            - Discrimination check results
            - Specific recommendations for improvement
            - Required changes to achieve compliance
            """,
            agent=self.agent
        )
        
        # Create crew and execute
        crew = Crew(
            agents=[self.agent],
            tasks=[compliance_task],
            verbose=settings.crewai_verbose
        )
        
        # Execute compliance validation
        result = crew.kickoff()
        
        # Parse and structure the result
        compliance_report = self._parse_compliance_result(result, property_data.property_id)
        
        return compliance_report
    
    def _format_content_for_validation(self, content_by_platform: Dict[str, GeneratedContent]) -> str:
        """Format content for validation analysis"""
        formatted_content = ""
        
        for platform, content in content_by_platform.items():
            formatted_content += f"""
            {platform.upper()}:
            Headline: {content.headline}
            Description: {content.description}
            Features: {', '.join(content.key_features)}
            Call to Action: {content.call_to_action}
            Hashtags: {', '.join(content.hashtags)}
            """
        
        return formatted_content
    
    def _parse_compliance_result(self, result: str, property_id: str) -> ComplianceReport:
        """Parse the crew result into structured ComplianceReport"""
        
        # For now, return structured compliance report based on the text result
        # In production, you'd parse the LLM output more carefully
        
        return ComplianceReport(
            property_id=property_id,
            is_compliant=self._determine_compliance(result),
            compliance_score=self._extract_compliance_score(result),
            mandatory_fields_present=self._check_mandatory_fields(result),
            prohibited_terms_found=self._extract_prohibited_terms(result),
            discriminatory_language=self._extract_discriminatory_language(result),
            asa_violations=self._extract_asa_violations(result),
            recommendations=self._extract_recommendations(result),
            required_changes=self._extract_required_changes(result)
        )
    
    def _determine_compliance(self, result: str) -> bool:
        """Determine if content is compliant"""
        # Simple heuristic - in production, use more sophisticated analysis
        non_compliant_indicators = [
            "non-compliant", "violation", "prohibited", "discriminatory",
            "missing mandatory", "asa violation", "misleading"
        ]
        
        for indicator in non_compliant_indicators:
            if indicator in result.lower():
                return False
        
        return True
    
    def _extract_compliance_score(self, result: str) -> float:
        """Extract compliance score from result"""
        # Look for score patterns
        import re
        score_match = re.search(r'(\d+)%?', result)
        if score_match:
            return float(score_match.group(1))
        
        # Default score based on compliance determination
        return 85.0 if self._determine_compliance(result) else 45.0
    
    def _check_mandatory_fields(self, result: str) -> Dict[str, bool]:
        """Check which mandatory fields are present"""
        fields = {
            "price": "price" in result.lower(),
            "tenure": "tenure" in result.lower(),
            "council_tax_band": "council" in result.lower() and "tax" in result.lower(),
            "epc_rating": "epc" in result.lower()
        }
        return fields
    
    def _extract_prohibited_terms(self, result: str) -> List[str]:
        """Extract prohibited terms found in content"""
        prohibited_found = []
        
        for term in UK_COMPLIANCE_RULES['prohibited_terms']:
            if term in result.lower():
                prohibited_found.append(term)
        
        return prohibited_found
    
    def _extract_discriminatory_language(self, result: str) -> List[str]:
        """Extract discriminatory language found"""
        discriminatory_found = []
        
        for term in UK_COMPLIANCE_RULES['discriminatory_terms']:
            if term in result.lower():
                discriminatory_found.append(term)
        
        return discriminatory_found
    
    def _extract_asa_violations(self, result: str) -> List[str]:
        """Extract ASA violations identified"""
        violations = []
        
        if "misleading" in result.lower():
            violations.append("Potentially misleading claims")
        if "superlative" in result.lower():
            violations.append("Unsubstantiated superlatives")
        if "accuracy" in result.lower():
            violations.append("Accuracy concerns")
        
        return violations
    
    def _extract_recommendations(self, result: str) -> List[str]:
        """Extract recommendations from result"""
        recommendations = []
        
        if "mandatory" in result.lower():
            recommendations.append("Include all mandatory property information")
        if "tone" in result.lower():
            recommendations.append("Adjust tone to be more factual")
        if "hashtags" in result.lower():
            recommendations.append("Review hashtag usage for compliance")
        
        return recommendations or ["Content appears compliant"]
    
    def _extract_required_changes(self, result: str) -> List[str]:
        """Extract required changes from result"""
        changes = []
        
        if "remove" in result.lower():
            changes.append("Remove prohibited terms")
        if "add" in result.lower() and "information" in result.lower():
            changes.append("Add missing mandatory information")
        if "revise" in result.lower():
            changes.append("Revise language for compliance")
        
        return changes or ["No changes required"]

