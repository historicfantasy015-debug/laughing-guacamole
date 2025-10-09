import React, { useState } from 'react';
import Header from './components/Header';
import QuestionChecker from './QuestionChecker';
import APIKeyManager from './components/APIKeyManager';
import { KeyIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

function App() {
  const [activeTab, setActiveTab] = useState('checker');

  return (
    <div className="min-h-screen bg-background text-text">
      <Header />

      <div className="border-b border-border bg-surface">
        <div className="container mx-auto px-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('checker')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all border-b-2 ${
                activeTab === 'checker'
                  ? 'text-primary border-primary'
                  : 'text-textSecondary border-transparent hover:text-text'
              }`}
            >
              <CheckCircleIcon className="h-5 w-5" />
              Question Checker
            </button>
            <button
              onClick={() => setActiveTab('api-keys')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all border-b-2 ${
                activeTab === 'api-keys'
                  ? 'text-primary border-primary'
                  : 'text-textSecondary border-transparent hover:text-text'
              }`}
            >
              <KeyIcon className="h-5 w-5" />
              API Keys
            </button>
          </div>
        </div>
      </div>

      <main className="py-8">
        {activeTab === 'checker' && <QuestionChecker />}
        {activeTab === 'api-keys' && <APIKeyManager />}
      </main>
    </div>
  );
}

export default App;
