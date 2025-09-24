import React from 'react';
import Header from './components/Header';
import QuestionChecker from './QuestionChecker';

function App() {
  return (
    <div className="min-h-screen bg-background text-text">
      <Header />
      <main className="py-8">
        <QuestionChecker />
      </main>
    </div>
  );
}

export default App;
