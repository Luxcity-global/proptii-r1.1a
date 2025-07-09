# Full-Fledged Development Plan: Scrappy AI Search Improvement

## Migration to GPT-4.1 via Azure AI Foundry

---

## 📋 **Executive Summary**

This development plan outlines the implementation of an enhanced property harvesting feature that leverages GPT-4.1 through Azure AI Foundry to extract and display properties from multiple UK estate agent sources as native listings within the Proptii platform.

### 🎯 **Key Objectives**

1. **Validate the concept** through rapid prototyping with mock data
2. **Implement AI-powered data extraction** using GPT-4.1
3. **Create a seamless user experience** for property discovery
4. **Build a scalable architecture** for future expansion
5. **Ensure legal compliance** and ethical scraping practices
6. **Test in isolated environment** before production integration

### 📊 **Success Metrics**

- User engagement with harvested properties
- Search result relevance scores
- Agent contact conversion rates
- System performance and reliability
- Cost efficiency of AI operations

### 🧪 **Test Environment Strategy**

- **Isolated Development** - Separate branch and environment
- **Feature Flags** - Controlled rollout and testing
- **A/B Testing** - Compare with existing search functionality
- **Gradual Migration** - Phased integration into main app

---

## 🏗️ **Test Environment Setup (Pre-Development)**

### **Environment Isolation**

**Duration:** 1 day
**Priority:** Critical

#### **Tasks:**

- [ ] **Create isolated development branch**

  ```bash
  git checkout -b feature/ai-property-harvesting
  git push -u origin feature/ai-property-harvesting
  ```

- [ ] **Set up test environment configuration**

  ```typescript
  // src/config/test-environment.ts
  export const testConfig = {
    harvesting: {
      enabled: true,
      testMode: true,
      mockDataOnly: true, // Start with mock data only
      aiEnabled: false, // Disable AI initially
      scrapingEnabled: false, // Disable scraping initially
    },
    featureFlags: {
      enableHarvestingSearch: true,
      enableHarvestingResults: true,
      enableAgentContact: true,
      enableAnalytics: false,
    },
  };
  ```

- [ ] **Create test database schema**

  ```sql
  -- Separate test tables for harvesting
  CREATE TABLE test_harvested_properties (
    id VARCHAR(255) PRIMARY KEY,
    source VARCHAR(50),
    title VARCHAR(500),
    price DECIMAL(10,2),
    -- ... other fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    test_environment BOOLEAN DEFAULT TRUE
  );
  ```

- [ ] **Set up test API endpoints**
  ```
  /api/test/harvesting/search     # Test search endpoint
  /api/test/harvesting/results    # Test results endpoint
  /api/test/harvesting/contact    # Test contact endpoint
  /api/test/harvesting/analytics  # Test analytics endpoint
  ```

#### **Deliverables:**

- [ ] Isolated development branch
- [ ] Test environment configuration
- [ ] Test database schema
- [ ] Test API endpoints

### **Feature Flag Implementation**

**Duration:** 1 day
**Priority:** High

#### **Tasks:**

- [ ] **Implement feature flag system**

  ```typescript
  // src/utils/featureFlags.ts
  export const HARVESTING_FEATURES = {
    ENABLE_HARVESTING: "enable_property_harvesting",
    ENABLE_AI_EXTRACTION: "enable_ai_extraction",
    ENABLE_SCRAPING: "enable_web_scraping",
    ENABLE_ANALYTICS: "enable_harvesting_analytics",
  };

  export const isFeatureEnabled = (feature: string): boolean => {
    // Check environment variables and user permissions
    return process.env[`VITE_${feature.toUpperCase()}`] === "true";
  };
  ```

- [ ] **Create feature toggle components**

  ```typescript
  // src/components/common/FeatureGate.tsx
  interface FeatureGateProps {
    feature: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }

  const FeatureGate: React.FC<FeatureGateProps> = ({
    feature,
    children,
    fallback,
  }) => {
    const isEnabled = isFeatureEnabled(feature);
    return isEnabled ? <>{children}</> : <>{fallback}</>;
  };
  ```

- [ ] **Add navigation guards**

  ```typescript
  // src/routes/ProtectedHarvestingRoute.tsx
  const ProtectedHarvestingRoute = () => {
    const isEnabled = isFeatureEnabled(HARVESTING_FEATURES.ENABLE_HARVESTING);

    if (!isEnabled) {
      return <Navigate to="/listings" replace />;
    }

    return <HarvestingPage />;
  };
  ```

#### **Deliverables:**

- [ ] Feature flag system
- [ ] Feature toggle components
- [ ] Navigation guards
- [ ] Environment-based configuration

---

## 🚀 **Sprint Breakdown**

### **Sprint 1: Foundation & Mock Data (Week 1-2)**

**Duration:** 10 days
**Goal:** Create working prototype with mock data

#### **Sprint 1 Objectives:**

- [ ] Set up isolated test environment
- [ ] Implement mock data service
- [ ] Build basic UI components
- [ ] Create feature flag system
- [ ] Establish testing framework

#### **Sprint 1 Tasks:**

**Day 1-2: Environment Setup**

- [ ] Create isolated development branch
- [ ] Set up test environment configuration
- [ ] Create test database schema
- [ ] Implement feature flag system

**Day 3-4: Mock Data Implementation**

- [ ] Create realistic mock data service
- [ ] Generate diverse mock datasets (50+ properties)
- [ ] Implement relevance scoring simulation
- [ ] Set up data validation

**Day 5-7: UI/UX Implementation**

- [ ] Build harvesting search interface
- [ ] Create results display with grid/list views
- [ ] Implement agent contact modal
- [ ] Add responsive design

**Day 8-10: Integration & Testing**

- [ ] Connect all components
- [ ] Implement basic caching
- [ ] Add unit tests
- [ ] Perform user acceptance testing

#### **Sprint 1 Deliverables:**

- [ ] Working prototype with mock data
- [ ] Complete UI/UX implementation
- [ ] Feature flag system
- [ ] Basic testing framework
- [ ] Test environment documentation

#### **Sprint 1 Definition of Done:**

- [ ] Users can search and view mock harvested properties
- [ ] Agent contact functionality works
- [ ] Feature flags control all functionality
- [ ] All components are tested
- [ ] Performance meets requirements (< 3s response time)

#### **Sprint 1: Post-Implementation Update (June 2025)**

#### **Latest UI/UX and Feature Improvements**

- **Property Card UI Clean-up:**
  - Removed all "TEST LISTING" and source badges from property images for a cleaner look.
  - Only the property title contains the "TEST LISTING" label for dev/test clarity.
- **Favorites (Heart) Feature:**
  - Only one heart icon per property, now overlayed on the main image (top-right corner).
  - Heart icon sits on a white, semi-transparent circle for high visibility.
  - On hover: background becomes fully white, heart color darkens.
  - On click: heart fills red, background remains white.
  - Smooth transitions for a modern, tactile feel.
- **Favorites Integration:**
  - Saved properties persist via localStorage and appear in the dashboard's "Saved Properties" section.
  - No duplicate hearts or overlays; UI is clean and intuitive.
- **Seamless User Experience:**
  - All core features (search, save, view, contact agent) work smoothly with mock data.
  - Responsive and accessible design.

#### **Sprint 1 Status**

- ✅ Sprint 1 (Foundation & Mock Data) is now **COMPLETE**.
- All UI/UX, feature flag, and dashboard integration goals have been met.

#### **Next Phase**

- The next logical phase is **Sprint 2: AI Integration & Scraping**.
- This will focus on integrating GPT-4.1 (Azure AI Foundry), building the data extraction pipeline, and implementing web scraping for major sources.

---

## 🎯 **Sprint 2: Key Requirements & Approach**

### **Azure AI Foundry Integration**

- **Setup Approach:** Prefer Azure AI Foundry portal setup with comprehensive prompt template
- **Alternative:** Cursor IDE direct Azure access (if portal approach has limitations)
- **Goal:** Establish robust AI extraction pipeline with clear documentation

### **Natural Language Input**

- **Requirement:** Support natural language property search queries
- **Future Enhancement:** Voice input for multimodal capabilities
- **Implementation:** GPT-4.1 prompt engineering for query understanding and property extraction

### **Web Scraping Strategy**

- **Primary Source:** Openrent (not Rightmove as originally planned)
- **Documentation:** Rigorous process documentation for developer onboarding
- **Base Template:** Create reusable scraper framework for other sources
- **Effectiveness:** Focus on reliability and data quality over speed

### **Development Priorities**

1. Azure AI Foundry portal setup with comprehensive prompt template
2. Natural language input processing service
3. Openrent scraper with full documentation
4. Error handling, logging, and mock/AI data toggle
5. Integration testing and performance optimization

---

## ✅ **Sprint 2: Backend Integration Complete**

### **Azure AI Foundry Setup (COMPLETED)**

- ✅ **Portal Setup Guide**: Comprehensive step-by-step instructions created
  - Project configuration: `proptii-property-extraction`
  - Model deployment: GPT-4.1 with UK South region
  - Input/output schema defined
  - Environment variables configured
  - Security considerations documented

### **Property Extraction Prompt Template (COMPLETED)**

- ✅ **Comprehensive Prompt Template**: Complete GPT-4.1 prompt engineering
  - System prompt with UK property context
  - Main extraction prompt with structured output
  - Natural language query processing
  - Edge case handling and confidence scoring
  - Example prompts and testing strategy
  - Performance optimization guidelines

### **Backend Integration (COMPLETED)**

- ✅ **Property Extraction Service**: Complete NestJS service implementation

  - Natural language query processing
  - Web content property extraction
  - Structured JSON output with confidence scoring
  - Error handling and validation
  - Connection testing and health checks

- ✅ **API Endpoints**: Full REST API implementation

  - `POST /api/property-extraction/natural-language` - Process natural language queries
  - `POST /api/property-extraction/web-content` - Extract from web content
  - `POST /api/property-extraction/extract` - General extraction endpoint
  - `GET /api/property-extraction/test` - Azure AI connection test
  - `GET /api/property-extraction/health` - Health check

- ✅ **Integration Testing**: Comprehensive test suite

  - Automated test script for all endpoints
  - Error handling validation
  - Performance monitoring
  - Connection testing

- ✅ **Documentation**: Complete integration guide
  - Environment setup instructions
  - API endpoint documentation
  - Error handling guide
  - Troubleshooting section

### **Next Steps for Sprint 2**

- [ ] **Openrent Scraper**: Build web scraping service with documentation
- [ ] **Frontend Integration**: Connect AI extraction with External Collections UI
- [ ] **Performance Testing**: Load testing and optimization
- [ ] **Production Deployment**: Environment setup and monitoring

---

### **Sprint 2: AI Integration & Scraping (Week 3-4)**

**Duration:** 10 days
**Goal:** Implement AI-powered data extraction and web scraping

#### **Sprint 2 Objectives:**

- [ ] Integrate GPT-4.1 via Azure AI Foundry
- [ ] Implement web scraping for major sources
- [ ] Build data extraction pipeline
- [ ] Create relevance scoring system
- [ ] Add monitoring and analytics

#### **Sprint 2 Tasks:**

**Day 1-3: AI Integration**

- [ ] Set up Azure AI Foundry integration
- [ ] Create GPT-4.1 service
- [ ] Implement prompt templates
- [ ] Add error handling and retry logic

**Day 4-6: Data Extraction Pipeline**

- [ ] Build template-based extraction system
- [ ] Implement hybrid extraction approach
- [ ] Create data standardization pipeline
- [ ] Add data validation and cleaning

**Day 7-8: Web Scraping**

- [ ] Implement Rightmove scraper
- [ ] Implement Zoopla scraper
- [ ] Add rate limiting and error handling
- [ ] Create scraping orchestration

**Day 9-10: Integration & Testing**

- [ ] Connect AI extraction with scraping
- [ ] Implement relevance scoring
- [ ] Add monitoring and logging
- [ ] Performance testing and optimization

#### **Sprint 2 Deliverables:**

- [ ] GPT-4.1 integration complete
- [ ] Web scraping for Rightmove and Zoopla
- [ ] Data extraction pipeline
- [ ] Relevance scoring system
- [ ] Monitoring and analytics

#### **Sprint 2 Definition of Done:**

- [ ] AI extraction accuracy > 90%
- [ ] Scraping success rate > 95%
- [ ] Response time < 3 seconds
- [ ] Error handling covers all scenarios
- [ ] Monitoring provides actionable insights

---

### **Sprint 3: Production Readiness & Migration (Week 5-6)**

**Duration:** 10 days
**Goal:** Prepare for production and migrate to main app

#### **Sprint 3 Objectives:**

- [ ] Complete testing and quality assurance
- [ ] Implement legal compliance measures
- [ ] Prepare production deployment
- [ ] Create migration strategy
- [ ] Plan gradual rollout

#### **Sprint 3 Tasks:**

**Day 1-3: Testing & Quality Assurance**

- [ ] Comprehensive unit testing
- [ ] Integration testing
- [ ] Performance testing
- [ ] Security testing
- [ ] User acceptance testing

**Day 4-5: Legal & Compliance**

- [ ] Review scraping compliance
- [ ] Implement safeguards
- [ ] Create compliance documentation
- [ ] Legal risk assessment

**Day 6-7: Production Preparation**

- [ ] Environment configuration
- [ ] Deployment pipeline setup
- [ ] Monitoring and alerting
- [ ] Backup and recovery procedures

**Day 8-10: Migration Planning**

- [ ] Create migration strategy
- [ ] Plan gradual rollout
- [ ] Prepare rollback procedures
- [ ] Stakeholder communication plan

#### **Sprint 3 Deliverables:**

- [ ] Production-ready system
- [ ] Comprehensive test suite
- [ ] Compliance documentation
- [ ] Migration strategy
- [ ] Rollout plan

#### **Sprint 3 Definition of Done:**

- [ ] All tests pass
- [ ] Legal compliance verified
- [ ] Production environment ready
- [ ] Migration strategy approved
- [ ] Rollback procedures tested

---

## 🔄 **Migration Strategy**

### **Phase 1: Test Environment Validation (Week 6)**

**Duration:** 5 days
**Priority:** Critical

#### **Tasks:**

- [ ] **Internal testing and validation**

  - Test with internal team members
  - Validate all functionality works as expected
  - Performance testing under load
  - Security testing and vulnerability assessment

- [ ] **Stakeholder review and approval**

  - Demo to stakeholders
  - Collect feedback and make adjustments
  - Final approval for migration

- [ ] **Documentation and training**
  - Create user documentation
  - Train support team
  - Prepare marketing materials

#### **Deliverables:**

- [ ] Validated test environment
- [ ] Stakeholder approval
- [ ] User documentation
- [ ] Support team training

### **Phase 2: Gradual Migration (Week 7)**

**Duration:** 5 days
**Priority:** Critical

#### **Tasks:**

- [ ] **Feature flag rollout**

  ```typescript
  // Gradual rollout strategy
  const rolloutStrategy = {
    day1: { percentage: 5, users: "internal-team" },
    day2: { percentage: 10, users: "beta-users" },
    day3: { percentage: 25, users: "early-adopters" },
    day4: { percentage: 50, users: "general-users" },
    day5: { percentage: 100, users: "all-users" },
  };
  ```

- [ ] **A/B testing implementation**

  - Compare harvesting search with existing search
  - Monitor user engagement metrics
  - Collect feedback and make adjustments

- [ ] **Performance monitoring**
  - Monitor system performance
  - Track AI API costs
  - Monitor user satisfaction

#### **Deliverables:**

- [ ] Gradual rollout implementation
- [ ] A/B testing framework
- [ ] Performance monitoring
- [ ] User feedback collection

### **Phase 3: Full Integration (Week 8)**

**Duration:** 5 days
**Priority:** High

#### **Tasks:**

- [ ] **Merge to main branch**

  ```bash
  git checkout main
  git merge feature/ai-property-harvesting
  git push origin main
  ```

- [ ] **Update production environment**

  - Deploy to production
  - Update environment variables
  - Enable feature flags

- [ ] **Monitor and optimize**
  - Monitor system performance
  - Optimize based on real usage
  - Address any issues

#### **Deliverables:**

- [ ] Production deployment
- [ ] Feature fully integrated
- [ ] Performance optimization
- [ ] Issue resolution

---

## 📊 **Updated Technical Architecture**

### **Test Environment Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Test          │    │   Test          │    │   Test          │
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │    │   (NestJS)      │    │   (Cosmos DB)   │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Test Search   │◄──►│ • Test API      │◄──►│ • Test Tables   │
│ • Test Results  │    │ • Test Services │    │ • Test Data     │
│ • Feature Flags │    │ • Test AI       │    │ • Test Schema   │
│ • A/B Testing   │    │ • Test Scraping │    │ • Test Indexes  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Migration Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Production    │    │   Feature       │    │   Monitoring    │
│   Frontend      │    │   Flags         │    │   & Analytics   │
│   (React)       │    │   (Config)      │    │   (Dashboard)   │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Main App      │◄──►│ • Gradual       │◄──►│ • Performance   │
│ • Harvesting    │    │   Rollout       │    │   Metrics       │
│ • A/B Testing   │    │ • User Groups   │    │ • Cost Tracking │
│ • Fallback      │    │ • Rollback      │    │ • User Feedback │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 💰 **Updated Cost Analysis & Budget**

### **Development Costs (3 Sprints)**

- **Sprint 1:** 10 days × £500 = £5,000
- **Sprint 2:** 10 days × £500 = £5,000
- **Sprint 3:** 10 days × £500 = £5,000
- **Migration:** 5 days × £500 = £2,500

**Total Development:** £17,500
**Monthly Operational:** £850-1,800

### **Test Environment Costs**

- **Test Database:** £50-100/month
- **Test AI API:** £100-200/month (reduced usage)
- **Test Infrastructure:** £50-100/month

**Total Test Environment:** £200-400/month

---

## 🎯 **Updated Success Criteria & KPIs**

### **Sprint-Specific KPIs**

#### **Sprint 1 KPIs:**

- **UI/UX Satisfaction:** > 4.0/5.0 user rating
- **Feature Flag Reliability:** 100% accuracy
- **Test Environment Stability:** > 99.5% uptime
- **Development Velocity:** All tasks completed on time

#### **Sprint 2 KPIs:**

- **AI Extraction Accuracy:** > 90%
- [ ] Scraping Success Rate:\*\* > 95%
- **Response Time:** < 3 seconds
- **Error Rate:** < 5%

#### **Sprint 3 KPIs:**

- **Test Coverage:** > 90%
- **Security Score:** > 95%
- **Compliance Status:** 100% compliant
- **Migration Readiness:** All criteria met

### **Migration KPIs:**

- **Rollout Success Rate:** > 95%
- **User Adoption:** > 60% within first week
- **Performance Impact:** < 10% degradation
- **Issue Resolution:** < 24 hours

---

## 🚨 **Updated Risk Assessment & Mitigation**

### **Test Environment Risks**

| Risk                   | Probability | Impact | Mitigation                          |
| ---------------------- | ----------- | ------ | ----------------------------------- |
| Test data corruption   | Low         | Medium | Regular backups and validation      |
| Feature flag conflicts | Medium      | Low    | Comprehensive testing and rollback  |
| Test environment costs | Medium      | Low    | Usage monitoring and limits         |
| Integration issues     | High        | Medium | Incremental integration and testing |

### **Migration Risks**

| Risk                          | Probability | Impact | Mitigation                              |
| ----------------------------- | ----------- | ------ | --------------------------------------- |
| Production deployment failure | Low         | High   | Comprehensive testing and rollback plan |
| User adoption issues          | Medium      | Medium | Gradual rollout and feedback collection |
| Performance degradation       | Medium      | High   | Performance testing and monitoring      |
| Data migration issues         | Low         | High   | Backup and validation procedures        |

---

## 📅 **Updated Timeline Summary**

```
Week 1-2: Sprint 1 - Foundation & Mock Data
├── Day 1-2: Environment setup & feature flags
├── Day 3-4: Mock data implementation
├── Day 5-7: UI/UX implementation
└── Day 8-10: Integration & testing

Week 3-4: Sprint 2 - AI Integration & Scraping
├── Day 1-3: AI integration (GPT-4.1)
├── Day 4-6: Data extraction pipeline
├── Day 7-8: Web scraping implementation
└── Day 9-10: Integration & testing

Week 5-6: Sprint 3 - Production Readiness & Migration
├── Day 1-3: Testing & quality assurance
├── Day 4-5: Legal & compliance
├── Day 6-7: Production preparation
└── Day 8-10: Migration planning

Week 7: Migration Phase 1 - Test Environment Validation
├── Day 1-3: Internal testing and validation
├── Day 4: Stakeholder review and approval
└── Day 5: Documentation and training

Week 8: Migration Phase 2-3 - Gradual Rollout & Full Integration
├── Day 1-3: Gradual rollout with A/B testing
├── Day 4: Full integration
└── Day 5: Monitor and optimize
```

**Total Duration:** 8 weeks (40 working days)
**Total Cost:** £17,500 development + £850-1,800/month operational

---

## 🎉 **Updated Next Steps**

1. **Immediate Actions (This Week)**

   - [ ] Review and approve updated development plan
   - [ ] Set up test environment infrastructure
   - [ ] Create isolated development branch
   - [ ] Allocate development resources for 3 sprints

2. **Sprint 1 Preparation**

   - [ ] Finalize UI/UX designs
   - [ ] Set up test database and environment
   - [ ] Create detailed technical specifications
   - [ ] Establish testing frameworks

3. **Migration Preparation**

   - [ ] Plan stakeholder communication
   - [ ] Prepare marketing materials
   - [ ] Train support team
   - [ ] Set up monitoring and alerting

4. **Ongoing Activities**
   - [ ] Daily standups during sprints
   - [ ] Sprint reviews and retrospectives
   - [ ] Continuous integration and testing
   - [ ] Regular cost and performance monitoring

This updated development plan provides a comprehensive roadmap for implementing the scrappy AI search improvement feature in a safe, isolated environment before migrating to production. The 3-sprint approach ensures iterative development with clear milestones and deliverables.
