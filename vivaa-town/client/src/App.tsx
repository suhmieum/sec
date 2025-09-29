import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import SidebarLayout from './components/SidebarLayout';
import { NotificationProvider } from './components/NotificationSystem';
import Home from './pages/Home';
import Classes from './pages/Classes';
import StudentsTable from './pages/StudentsTable';
import Jobs from './pages/Jobs';
import Transactions from './pages/Transactions';
import Items from './pages/Items';
import Banking from './pages/Banking';
import Stocks from './pages/Stocks';
import Achievements from './pages/Achievements';
import AIPlan from './pages/AIPlan';
import PortfolioDetailed from './pages/PortfolioDetailed';
import PortfolioList from './pages/PortfolioList';
// import Analytics from './pages/Analytics';
import { useInitializeStores, useAppStore, useClassroomStore } from './state';

function AppContent() {
  const navigate = useNavigate();
  const classrooms = useClassroomStore(state => state.classrooms);

  useEffect(() => {
    // 학급이 하나도 없으면 학급 관리 페이지로 이동
    if (classrooms.length === 0) {
      navigate('/classes');
    }
  }, [classrooms, navigate]);

  return (
    <SidebarLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/students" element={<StudentsTable />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/items" element={<Items />} />
        <Route path="/banking" element={<Banking />} />
        <Route path="/stocks" element={<Stocks />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/ai-plan" element={<AIPlan />} />
        <Route path="/portfolio" element={<PortfolioList />} />
        <Route path="/portfolio/:studentId" element={<PortfolioDetailed />} />
        {/* <Route path="/analytics" element={<Analytics />} /> */}
      </Routes>
    </SidebarLayout>
  );
}

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
          <p className="text-gray-700 text-lg font-medium">비바빌리지를 시작하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <Router>
        <AppContent />
      </Router>
    </NotificationProvider>
  );
}

export default App;