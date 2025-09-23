import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SidebarLayout from './components/SidebarLayout';
import { NotificationProvider } from './components/NotificationSystem';
import Home from './pages/Home';
import Classes from './pages/Classes';
import Students from './pages/Students';
import Jobs from './pages/Jobs';
import Transactions from './pages/Transactions';
import Items from './pages/Items';
import Banking from './pages/Banking';
import Stocks from './pages/Stocks';
import Achievements from './pages/Achievements';
// import Analytics from './pages/Analytics';
import { useInitializeStores, useAppStore } from './state';

function App() {
  const { initialize } = useInitializeStores();
  const isInitialized = useAppStore(state => state.isInitialized);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-gray-700 text-lg font-medium">비바타운을 시작하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <Router>
        <SidebarLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/students" element={<Students />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/items" element={<Items />} />
            <Route path="/banking" element={<Banking />} />
            <Route path="/stocks" element={<Stocks />} />
            <Route path="/achievements" element={<Achievements />} />
            {/* <Route path="/analytics" element={<Analytics />} /> */}
          </Routes>
        </SidebarLayout>
      </Router>
    </NotificationProvider>
  );
}

export default App;