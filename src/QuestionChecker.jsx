import React, { useState, useEffect } from 'react';
import { supabase } from './api/supabase';
import { checkQuestionWithGemini } from './api/gemini';
import QuestionCard from './components/QuestionCard';
import Button from './components/Button';
import { ArrowPathIcon, PlayIcon, PauseIcon, StopIcon } from '@heroicons/react/24/outline';
import { ExclamationCircleIcon } from '@heroicons/react/24/solid';

const QuestionChecker = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkingQuestions, setCheckingQuestions] = useState(new Set());
  const [autoChecking, setAutoChecking] = useState(false);
  const [autoCheckPaused, setAutoCheckPaused] = useState(false);
  const [currentAutoCheckIndex, setCurrentAutoCheckIndex] = useState(0);
  const [autoCheckStats, setAutoCheckStats] = useState({
    total: 0,
    processed: 0,
    correct: 0,
    wrong: 0,
    errors: 0
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (autoChecking && !autoCheckPaused && questions.length > 0) {
      processNextQuestion();
    }
  }, [autoChecking, autoCheckPaused, currentAutoCheckIndex, questions]);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('new_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const parsedData = data.map(q => ({
        ...q,
        options: q.options ? (typeof q.options === 'string' ? 
          (q.options.trim().startsWith('[') ? JSON.parse(q.options) : [q.options]) : 
          (Array.isArray(q.options) ? q.options : [q.options])
        ) : []
      }));
      setQuestions(parsedData || []);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions. Please ensure your Supabase project is configured and the "new_questions" table exists with RLS policies allowing public read access.');
    } finally {
      setLoading(false);
    }
  };

  const startAutoCheck = () => {
    const uncheckedQuestions = questions.filter(q => q.is_wrong === null || q.is_wrong === undefined);
    if (uncheckedQuestions.length === 0) {
      setError('No unchecked questions found. All questions have already been processed.');
      return;
    }

    setAutoChecking(true);
    setAutoCheckPaused(false);
    setCurrentAutoCheckIndex(0);
    setAutoCheckStats({
      total: uncheckedQuestions.length,
      processed: 0,
      correct: 0,
      wrong: 0,
      errors: 0
    });
    setError(null);
  };

  const pauseAutoCheck = () => {
    setAutoCheckPaused(true);
  };

  const resumeAutoCheck = () => {
    setAutoCheckPaused(false);
  };

  const stopAutoCheck = () => {
    setAutoChecking(false);
    setAutoCheckPaused(false);
    setCurrentAutoCheckIndex(0);
    setCheckingQuestions(new Set());
  };

  const processNextQuestion = async () => {
    if (autoCheckPaused || !autoChecking) return;

    const uncheckedQuestions = questions.filter(q => q.is_wrong === null || q.is_wrong === undefined);
    
    if (currentAutoCheckIndex >= uncheckedQuestions.length) {
      // All questions processed
      setAutoChecking(false);
      setAutoCheckPaused(false);
      setCurrentAutoCheckIndex(0);
      setCheckingQuestions(new Set());
      setError(`Auto-check completed! Processed ${autoCheckStats.total} questions: ${autoCheckStats.correct} correct, ${autoCheckStats.wrong} wrong, ${autoCheckStats.errors} errors.`);
      return;
    }

    const currentQuestion = uncheckedQuestions[currentAutoCheckIndex];
    if (!currentQuestion) return;

    await handleCheckQuestion(currentQuestion.id, true);
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const handleCheckQuestion = async (questionId) => {
    const isAutoCheck = arguments[1] || false;
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    setCheckingQuestions(prev => new Set([...prev, questionId]));
    
    try {
      const isWrong = await checkQuestionWithGemini(question);
      
      // Update Supabase
      const { error: updateError } = await supabase
        .from('new_questions')
        .update({ is_wrong: isWrong })
        .eq('id', questionId);

      if (updateError) throw updateError;

      // Update local state
      setQuestions(prev => prev.map(q => 
        q.id === questionId ? { ...q, is_wrong: isWrong, check_error: false } : q
      ));

      // Update auto-check stats
      if (isAutoCheck) {
        setAutoCheckStats(prev => ({
          ...prev,
          processed: prev.processed + 1,
          correct: prev.correct + (isWrong ? 0 : 1),
          wrong: prev.wrong + (isWrong ? 1 : 0)
        }));
      }

    } catch (err) {
      console.error(`Error checking question ${questionId}:`, err);
      
      setQuestions(prev => prev.map(q => 
        q.id === questionId ? { ...q, is_wrong: true, check_error: true } : q
      ));
      
      if (isAutoCheck) {
        setAutoCheckStats(prev => ({
          ...prev,
          processed: prev.processed + 1,
          errors: prev.errors + 1
        }));
        
        // Wait 30 seconds before continuing with next question
        console.log('Error occurred, waiting 30 seconds before continuing...');
        await sleep(30000);
      } else {
        setError(`Failed to check question. Please check your Gemini API key and try again.`);
      }
    } finally {
      setCheckingQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
      
      // Move to next question in auto-check mode
      if (isAutoCheck && autoChecking) {
        setCurrentAutoCheckIndex(prev => prev + 1);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-400px)] md:h-[calc(100vh-500px)] text-text text-xl animate-pulse">
        <ArrowPathIcon className="h-12 w-12 text-primary mb-4 animate-spin" />
        Loading questions...
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="text-error text-center p-8 mt-12 bg-surface rounded-xl mx-auto max-w-2xl shadow-lg">
        <ExclamationCircleIcon className="h-16 w-16 text-error mx-auto mb-4" />
        <p className="text-xl font-semibold mb-2">Error Loading Questions</p>
        <p className="text-textSecondary">{error}</p>
        <Button onClick={fetchQuestions} className="mt-6">Retry Loading</Button>
      </div>
    );
  }

  const uncheckedCount = questions.filter(q => q.is_wrong === null || q.is_wrong === undefined).length;
  const checkedCount = questions.length - uncheckedCount;
  const correctCount = questions.filter(q => q.is_wrong === false).length;
  const wrongCount = questions.filter(q => q.is_wrong === true).length;

  return (
    <div className="container mx-auto p-4 max-w-7xl mt-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4 animate-fade-in-up delay-300">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-text text-center md:text-left">Question Checker</h2>
          <p className="text-textSecondary mt-2">
            {autoChecking 
              ? `Auto-checking in progress... (${autoCheckStats.processed}/${autoCheckStats.total})`
              : 'Use auto-check or manually validate questions with Gemini AI'
            }
          </p>
        </div>
        <div className="flex gap-3">
          {!autoChecking ? (
            <>
              <Button
                onClick={startAutoCheck}
                disabled={uncheckedCount === 0}
                className="px-6 py-3 text-lg bg-success hover:bg-success/80"
              >
                <PlayIcon className="h-5 w-5 mr-2" />
                Auto Check ({uncheckedCount})
              </Button>
              <Button
                onClick={fetchQuestions}
                className="px-6 py-3 text-lg"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Refresh
              </Button>
            </>
          ) : (
            <>
              {autoCheckPaused ? (
                <Button
                  onClick={resumeAutoCheck}
                  className="px-6 py-3 text-lg bg-success hover:bg-success/80"
                >
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Resume
                </Button>
              ) : (
                <Button
                  onClick={pauseAutoCheck}
                  className="px-6 py-3 text-lg bg-warning hover:bg-warning/80"
                >
                  <PauseIcon className="h-5 w-5 mr-2" />
                  Pause
                </Button>
              )}
              <Button
                onClick={stopAutoCheck}
                className="px-6 py-3 text-lg bg-error hover:bg-error/80"
              >
                <StopIcon className="h-5 w-5 mr-2" />
                Stop
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Statistics Panel */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 animate-fade-in-up delay-400">
        <div className="bg-surface p-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-text">{questions.length}</div>
          <div className="text-sm text-textSecondary">Total</div>
        </div>
        <div className="bg-surface p-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-textSecondary">{uncheckedCount}</div>
          <div className="text-sm text-textSecondary">Unchecked</div>
        </div>
        <div className="bg-surface p-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-success">{correctCount}</div>
          <div className="text-sm text-textSecondary">Correct</div>
        </div>
        <div className="bg-surface p-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-error">{wrongCount}</div>
          <div className="text-sm text-textSecondary">Wrong</div>
        </div>
        <div className="bg-surface p-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-text">{checkedCount}</div>
          <div className="text-sm text-textSecondary">Checked</div>
        </div>
      </div>

      {/* Auto-check Progress */}
      {autoChecking && (
        <div className="bg-surface p-6 rounded-xl mb-8 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-text">Auto-Check Progress</h3>
            <div className="text-sm text-textSecondary">
              {autoCheckPaused ? 'Paused' : 'Running'}
            </div>
          </div>
          <div className="w-full bg-background rounded-full h-3 mb-4">
            <div 
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{ width: `${(autoCheckStats.processed / autoCheckStats.total) * 100}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="text-lg font-semibold text-text">{autoCheckStats.processed}</div>
              <div className="text-textSecondary">Processed</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-success">{autoCheckStats.correct}</div>
              <div className="text-textSecondary">Correct</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-error">{autoCheckStats.wrong}</div>
              <div className="text-textSecondary">Wrong</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-warning">{autoCheckStats.errors}</div>
              <div className="text-textSecondary">Errors</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className={`border rounded-xl p-4 mb-6 animate-fade-in-up ${
          error.includes('completed') 
            ? 'bg-success/10 border-success/20 text-success' 
            : 'bg-error/10 border-error/20 text-error'
        }`}>
          <p className="text-center">{error}</p>
        </div>
      )}

      {questions.length === 0 && !loading && (
        <div className="text-textSecondary text-center text-lg mt-16 p-8 bg-surface rounded-xl shadow-lg animate-fade-in-up delay-400">
          <ExclamationCircleIcon className="h-16 w-16 text-textSecondary mx-auto mb-4" />
          <p className="text-xl font-semibold mb-2">No Questions Found</p>
          <p>Add some questions to the `new_questions` table in Supabase to get started!</p>
          <Button onClick={fetchQuestions} className="mt-6">Refresh List</Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {questions.map((question) => (
          <QuestionCard 
            key={question.id} 
            question={question}
            onCheck={() => handleCheckQuestion(question.id)}
            isChecking={checkingQuestions.has(question.id)}
            disabled={autoChecking}
          />
        ))}
      </div>
    </div>
  );
};

export default QuestionChecker;