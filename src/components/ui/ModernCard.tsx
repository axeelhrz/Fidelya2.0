'use client';

import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { css } from '@emotion/react';

interface ModernCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'gradient' | 'elevated' | 'outlined';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  clickable?: boolean;
  glow?: boolean;
  className?: string;
  onClick?: () => void;
}

const CardContainer = styled(motion.div)<{
  variant: string;
  size: string;
  hover: boolean;
  clickable: boolean;
  glow: boolean;
}>`
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  ${({ size }) => {
    switch (size) {
      case 'sm':
        return css`
          padding: 1rem;
          border-radius: 1rem;
        `;
      case 'md':
        return css`
          padding: 1.5rem;
          border-radius: 1.5rem;
        `;
      case 'lg':
        return css`
          padding: 2rem;
          border-radius: 2rem;
        `;
      case 'xl':
        return css`
          padding: 2.5rem;
          border-radius: 2.5rem;
        `;
      default:
        return css`
          padding: 1.5rem;
          border-radius: 1.5rem;
        `;
    }
  }}
  
  ${({ variant }) => {
    switch (variant) {
      case 'glass':
        return css`
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        `;
      case 'gradient':
        return css`
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
          color: white;
          box-shadow: 0 20px 60px -15px rgba(99, 102, 241, 0.4);
        `;
      case 'elevated':
        return css`
          background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
          border: 1px solid #f1f5f9;
          box-shadow: 0 20px 60px -15px rgba(0, 0, 0, 0.1);
        `;
      case 'outlined':
        return css`
          background: #ffffff;
          border: 2px solid #e2e8f0;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
        `;
      default:
        return css`
          background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
          border: 1px solid #f1f5f9;
          box-shadow: 0 20px 60px -15px rgba(0, 0, 0, 0.1);
        `;
    }
  }}
  
  ${({ hover, variant }) => hover && css`
    &:hover {
      transform: translateY(-8px);
      ${variant === 'glass' && css`
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
      `}
      ${variant === 'gradient' && css`
        box-shadow: 0 25px 80px -20px rgba(99, 102, 241, 0.6);
      `}
      ${(variant === 'default' || variant === 'elevated') && css`
        box-shadow: 0 25px 80px -20px rgba(0, 0, 0, 0.15);
        border-color: rgba(99, 102, 241, 0.2);
      `}
      ${variant === 'outlined' && css`
        border-color: #6366f1;
        box-shadow: 0 12px 32px rgba(99, 102, 241, 0.15);
      `}
    }
  `}
  
  ${({ clickable }) => clickable && css`
    cursor: pointer;
    &:active {
      transform: translateY(-4px);
    }
  `}
  
  ${({ glow, variant }) => glow && css`
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: ${variant === 'gradient' 
        ? 'linear-gradient(90deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.5))'
        : 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)'
      };
      opacity: 0.8;
      border-radius: inherit;
    }
  `}
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    transition: left 0.6s ease;
  }
  
  &:hover::after {
    left: 100%;
  }
`;

const ModernCard: React.FC<ModernCardProps> = ({
  children,
  variant = 'default',
  size = 'md',
  hover = true,
  clickable = false,
  glow = false,
  className,
  onClick
}) => {
  return (
    <CardContainer
      variant={variant}
      size={size}
      hover={hover}
      clickable={clickable}
      glow={glow}
      className={className}
      onClick={onClick}
      whileHover={hover ? { y: -8 } : undefined}
      whileTap={clickable ? { y: -4 } : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1]
      }}
    >
      {children}
    </CardContainer>
  );
};

export default ModernCard;
