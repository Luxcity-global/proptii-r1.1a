# Proptii Search Micro-service

A high-speed, AI-driven search engine built specifically for property discovery and discovery within the Proptii ecosystem.

## 🛠️ Technology Stack
- **Frontend**: [Vite + React] Light-weight search UI component.
- **Backend**: [Node.js + Azure OpenAI] Embedding-based search logic.
- **Data Engine**: [Azure AI Search](https://azure.microsoft.com/en-us/products/ai-services/cognitive-search) (formerly Cognitive Search).

---

## 🏗️ Components

### 1. [Frontend](frontend/)
The frontend component provides a specialized search bar and results listing that can be embedded into the main website or used as a standalone tool. It handles:
- **Autocomplete**: High-performance character-by-character prediction.
- **Filters**: Advanced faceting by price, location, property type, and amenities.
- **Debounced Input**: Reducing API overhead during rapid typing.

### 2. [Backend](backend/)
The backend component bridges the gap between the UI and the search index. It manages:
- **Embeddings**: Converting user queries into high-dimensional vectors.
- **Ranker**: Re-ranking results from the SQL database and index for optimal relevance.
- **Caching**: Storing frequent queries to minimize AI inference latency.

---

## 🚀 Running Locally

### Backend Setup
```bash
cd search/backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd search/frontend
npm install
npm run dev
```

---

## 📁 Repository Structure
- **[`frontend/`](frontend/)**: UI components and search state management.
- **[`backend/`](backend/)**: AI embedding logic and index proxies.
- **`package.json`**: Shared dev dependencies for search-specific testing.

---
© 2026 Proptii. All Rights Reserved.
