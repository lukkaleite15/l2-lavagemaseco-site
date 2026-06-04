import React from 'react';

export const Button = ({ children, className = '', ...props }) => (
  <button 
    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${className}`} 
    {...props}
  >
    {children}
  </button>
);

export const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white rounded-xl shadow-md overflow-hidden ${className}`} {...props}>
    {children}
  </div>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const Input = ({ className = '', ...props }) => (
  <input 
    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`} 
    {...props} 
  />
);

