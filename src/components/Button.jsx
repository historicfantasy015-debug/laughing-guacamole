import React from 'react';

const Button = ({ children, className = '', ...props }) => {
  return (
    <button
      className={`
        bg-primary text-text font-semibold py-2 px-4 rounded-xl
        hover:bg-accent transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
