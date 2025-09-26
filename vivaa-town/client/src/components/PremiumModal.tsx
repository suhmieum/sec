import React, { useState } from 'react';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  onApiKeySubmit: (apiKey: string) => void;
}

export default function PremiumModal({ isOpen, onClose, featureName, onApiKeySubmit }: PremiumModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsSubmitting(true);
    try {
      await onApiKeySubmit(apiKey.trim());
      onClose();
    } catch (error) {
      console.error('API Key 검증 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="h-6 w-6 text-sky-500" />
            <h2 className="text-xl font-bold text-gray-900">프리미엄 기능</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-sky-100 to-blue-100 rounded-lg p-6 mb-6">
            <SparklesIcon className="h-12 w-12 text-sky-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              해당 기능은 구독자 전용 기능입니다
            </h3>
            <p className="text-gray-600 text-sm">
              더 많은 기능을 이용하려면 유료 구독해주세요.
            </p>
          </div>

          <div className="bg-sky-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">또는 직접 API 키를 입력하세요</h4>
            <p className="text-xs text-gray-500 mb-4">
              Google AI Studio에서 Gemini API 키를 발급받아 사용할 수 있습니다
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Gemini API Key 입력"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-4 py-3 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!apiKey.trim() || isSubmitting}
                className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg font-medium transition-colors text-sm"
              >
                {isSubmitting ? '검증 중...' : 'API 키 사용하기'}
              </button>
            </form>
          </div>

          <div className="text-center">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:text-sky-700 text-sm font-medium"
            >
              Google AI Studio에서 API 키 발급받기 →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}