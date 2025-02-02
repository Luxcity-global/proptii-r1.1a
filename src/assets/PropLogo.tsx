import React from 'react';

const PropLogo = ({ className = '' }) => {
  return (
    <svg className={className} viewBox="0 0 120 40" fill="currentColor">
      <path d="M20 10 L40 10 L30 30 Z" fill="#F15A22"/>
      <text x="45" y="28" fontSize="24" fontWeight="bold">proptii</text>
    </svg>
  );
};

export default PropLogo;