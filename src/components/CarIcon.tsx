import React from "react";

interface CarIconProps {
  className?: string;
  size?: number;
}

export const CarIcon: React.FC<CarIconProps> = ({ className = "", size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Corpo principal do carro */}
      <path
        d="M5 11L6.5 6.5C6.8 5.6 7.6 5 8.5 5H15.5C16.4 5 17.2 5.6 17.5 6.5L19 11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Base do carro */}
      <path
        d="M3 11H21C21.6 11 22 11.4 22 12V16C22 16.6 21.6 17 21 17H20C20 18.1 19.1 19 18 19C16.9 19 16 18.1 16 17H8C8 18.1 7.1 19 6 19C4.9 19 4 18.1 4 17H3C2.4 17 2 16.6 2 16V12C2 11.4 2.4 11 3 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.1"
      />
      
      {/* Rodas */}
      <circle
        cx="6"
        cy="17"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <circle
        cx="18"
        cy="17"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Janelas */}
      <path
        d="M7 11V8C7 7.4 7.4 7 8 7H16C16.6 7 17 7.4 17 8V11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Divisor da janela */}
      <line
        x1="12"
        y1="7"
        x2="12"
        y2="11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      
      {/* Faróis */}
      <circle
        cx="4.5"
        cy="13"
        r="0.5"
        fill="currentColor"
      />
      <circle
        cx="19.5"
        cy="13"
        r="0.5"
        fill="currentColor"
      />
    </svg>
  );
};