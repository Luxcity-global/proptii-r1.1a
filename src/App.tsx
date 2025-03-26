import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Referencing from './pages/Referencing';
import RedirectUriWarning from './components/RedirectUriWarning';
import ReferencingTest from './components/referencing/ReferencingTest';
import TestReferencingPage from './pages/test-referencing';
import BackendIntegrationTest from './pages/BackendIntegrationTest';
import ReferencingModalTest from './pages/ReferencingTest';
import Dashboard from './components/dashboard/Dashboard';
import DashboardHome from './components/dashboard/sections/DashboardHome';
import SavedProperties from './components/dashboard/sections/SavedProperties';
import Viewings from './components/dashboard/sections/Viewings';
import SavedListings from './components/saved-listings/SavedListings';
import './App.css';
import BookViewing from './pages/BookViewing';
import { SearchTest } from './components/__tests__/SearchTest';
import { PinStyleModalTest } from './components/__tests__/PinStyleModalTest';
import { ZoplaModalTest } from './components/__tests__/ZoplaModalTest';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search-test" element={<SearchTest />} />
            <Route path="/pin-style-test" element={<PinStyleModalTest />} />
            <Route path="/zoopla-test" element={<ZoplaModalTest />} />
            <Route path="/referencing" element={<Referencing />} />
            <Route path="/referencing-test" element={<ReferencingTest />} />
            <Route path="/test-referencing" element={<TestReferencingPage />} />
            <Route path="/backend-test" element={<BackendIntegrationTest />} />
            <Route path="/referencing-modal-test" element={<ReferencingModalTest />} />
            <Route path="/book-viewing" element={<BookViewing />} />
            
            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<Dashboard />}>
              <Route index element={<DashboardHome />} />
              <Route path="saved-searches" element={<SavedProperties />} />
              <Route path="saved-listings" element={<SavedListings />} />
              <Route path="viewings" element={<Viewings />} />
              <Route path="referencing" element={<div>Referencing Status</div>} />
              <Route path="contracts" element={<div>Contracts</div>} />
              <Route path="files" element={<div>Files</div>} />
            </Route>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;