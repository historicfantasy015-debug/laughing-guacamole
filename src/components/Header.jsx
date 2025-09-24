import React from 'react';

const Header = () => {
  return (
    <header className="relative h-[400px] md:h-[500px] overflow-hidden rounded-b-xl shadow-glow animate-fade-in-up">
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out"
        style={{
          backgroundImage: `url(https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2)`,
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-90"></div>
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/20 rounded-full mb-4">
            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-text drop-shadow-lg mb-4 leading-tight">
          AI-Powered <span className="text-primary">Question</span> Validator
        </h1>
        <p className="text-lg md:text-xl text-textSecondary max-w-3xl animate-fade-in-up delay-200">
          Leveraging <strong className="text-secondary">Gemini 2.0 Flash</strong> to meticulously validate educational content. 
          Check each question manually for accuracy and correctness.
        </p>
        <div className="mt-6 flex items-center gap-4 text-sm text-textSecondary animate-fade-in-up delay-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-success rounded-full"></div>
            <span>Correct Questions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-error rounded-full"></div>
            <span>Wrong Questions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-textSecondary rounded-full"></div>
            <span>Not Checked</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;