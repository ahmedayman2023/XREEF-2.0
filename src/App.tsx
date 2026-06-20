import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import StartupHello from './components/StartupHello';

const ProjectsPage = lazy(() => import('./components/ProjectsPage'));
const ProjectWorkspace = lazy(() => import('./components/ProjectWorkspace'));
const GalleryPage = lazy(() => import('./components/GalleryPage'));
const SupportPage = lazy(() => import('./components/SupportPage'));
const PrivacyPage = lazy(() => import('./components/PrivacyPage'));
const TermsPage = lazy(() => import('./components/TermsPage'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
  </div>
);

export default function App() {
  return (
    <StartupHello>
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<ProjectsPage />} />
            <Route path="/project/:projectId" element={<ProjectWorkspace />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
          </Routes>
        </Suspense>
      </Router>
    </StartupHello>
  );
}
