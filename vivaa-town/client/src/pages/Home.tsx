import { useNavigate } from 'react-router-dom';
import { useCurrentClassroom } from '../state';
import Dashboard from '../components/Dashboard';

function Home() {
  const navigate = useNavigate();
  const currentClass = useCurrentClassroom();

  return (
    <div className="space-y-6">
      {currentClass ? (
        <Dashboard />
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100/50 shadow-lg p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg
                className="w-12 h-12 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">학급이 없습니다</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              새로운 학급을 만들어 경제 교육을 시작해보세요!
            </p>
            <button
              onClick={() => navigate('/classes')}
              className="inline-flex items-center px-8 py-4 border-0 text-base font-semibold rounded-2xl shadow-lg text-white bg-slate-500 hover:bg-slate-600 transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <div className="w-5 h-5 mr-3">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              학급 만들기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;