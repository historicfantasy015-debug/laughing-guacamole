import React from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  QuestionMarkCircleIcon, 
  ExclamationCircleIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/solid';
import Button from './Button';

const QuestionCard = ({ question, onCheck, isChecking, disabled = false }) => {
  const { question_statement, options, question_type, is_wrong, check_error } = question;

  const statusIcon = () => {
    if (isChecking) {
      return <ArrowPathIcon className="h-6 w-6 text-primary animate-spin" />;
    }
    if (check_error) {
      return <ExclamationCircleIcon className="h-6 w-6 text-error" />;
    }
    if (is_wrong === null || is_wrong === undefined) {
      return <QuestionMarkCircleIcon className="h-6 w-6 text-textSecondary" />;
    }
    return is_wrong ? (
      <XCircleIcon className="h-6 w-6 text-error" />
    ) : (
      <CheckCircleIcon className="h-6 w-6 text-success" />
    );
  };

  const statusText = () => {
    if (isChecking) {
      return <span className="text-primary font-medium">Checking...</span>;
    }
    if (check_error) {
      return <span className="text-error font-medium">Check Error</span>;
    }
    if (is_wrong === null || is_wrong === undefined) {
      return <span className="text-textSecondary font-medium">Not Checked</span>;
    }
    return is_wrong ? (
      <span className="text-error font-medium">Wrong Question</span>
    ) : (
      <span className="text-success font-medium">Correct Question</span>
    );
  };

  const cardBorderClass = () => {
    if (isChecking) return 'border-primary shadow-md shadow-primary/30';
    if (check_error) return 'border-error shadow-md shadow-error/30';
    if (is_wrong === null || is_wrong === undefined) return 'border-border';
    return is_wrong ? 'border-error shadow-md shadow-error/30' : 'border-success shadow-md shadow-success/30';
  };

  const getQuestionTypeDescription = (type) => {
    switch (type) {
      case 'MCQ':
        return 'Multiple Choice Question';
      case 'MSQ':
        return 'Multiple Select Question';
      case 'NAT':
        return 'Numerical Answer Type';
      case 'SUB':
        return 'Subjective Question';
      default:
        return type;
    }
  };

  return (
    <div
      className={`
        bg-surface p-6 rounded-xl border-2 transition-all duration-300 ease-in-out
        hover:scale-[1.02] hover:shadow-lg
        ${cardBorderClass()}
        animate-fade-in-up
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">{question_type}</span>
          <p className="text-xs text-textSecondary">{getQuestionTypeDescription(question_type)}</p>
        </div>
        <div className="flex items-center gap-2">
          {statusIcon()}
          {statusText()}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-textSecondary text-sm mb-2 font-medium">Question Statement:</h3>
        <p className="text-text text-base leading-relaxed bg-background/50 p-3 rounded-lg">
          {question_statement}
        </p>
      </div>

      {options && options.length > 0 && (
        <div className="mb-4">
          <h4 className="text-textSecondary text-sm mb-2 font-medium">Options:</h4>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <span className="text-primary font-semibold min-w-[20px]">{String.fromCharCode(65 + index)}.</span>
                <span className="text-textSecondary">{option}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {check_error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-3 mb-4">
          <p className="text-error text-sm">
            An error occurred during AI check. Please try again or check your API configuration.
          </p>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-border">
        <Button
          onClick={onCheck}
          disabled={isChecking || disabled}
          className="w-full py-3 text-sm font-medium"
        >
          {isChecking ? (
            <>
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
              Checking with Gemini AI...
            </>
          ) : disabled ? (
            'Auto-check in progress...'
          ) : (
            'Check Question'
          )}
        </Button>
      </div>
    </div>
  );
};

export default QuestionCard;