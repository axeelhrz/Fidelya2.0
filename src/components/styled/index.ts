import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { motion } from 'framer-motion';
import tokens from '@/lib/theme';

// Base styled components
export const Box = styled(motion.div)<{
  p?: number;
  px?: number;
  py?: number;
  m?: number;
  mx?: number;
  my?: number;
  bg?: string;
  color?: string;
  borderRadius?: string;
  shadow?: string;
  border?: string;
  position?: 'relative' | 'absolute' | 'fixed' | 'sticky';
  display?: 'flex' | 'block' | 'inline' | 'inline-block' | 'grid' | 'none';
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  gap?: number;
  width?: string;
  height?: string;
  minHeight?: string;
  maxWidth?: string;
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
  zIndex?: number;
}>`
  ${({ p }) => p && `padding: ${tokens.spacing[p as keyof typeof tokens.spacing]};`}
  ${({ px }) => px && `padding-left: ${tokens.spacing[px as keyof typeof tokens.spacing]}; padding-right: ${tokens.spacing[px as keyof typeof tokens.spacing]};`}
  ${({ py }) => py && `padding-top: ${tokens.spacing[py as keyof typeof tokens.spacing]}; padding-bottom: ${tokens.spacing[py as keyof typeof tokens.spacing]};`}
  ${({ m }) => m && `margin: ${tokens.spacing[m as keyof typeof tokens.spacing]};`}
  ${({ mx }) => mx && `margin-left: ${tokens.spacing[mx as keyof typeof tokens.spacing]}; margin-right: ${tokens.spacing[mx as keyof typeof tokens.spacing]};`}
  ${({ my }) => my && `margin-top: ${tokens.spacing[my as keyof typeof tokens.spacing]}; margin-bottom: ${tokens.spacing[my as keyof typeof tokens.spacing]};`}
  ${({ bg }) => bg && `background: ${bg};`}
  ${({ color }) => color && `color: ${color};`}
  ${({ borderRadius }) => borderRadius && `border-radius: ${borderRadius};`}
  ${({ shadow }) => shadow && `box-shadow: ${shadow};`}
  ${({ border }) => border && `border: ${border};`}
  ${({ position }) => position && `position: ${position};`}
  ${({ display }) => display && `display: ${display};`}
  ${({ flexDirection }) => flexDirection && `flex-direction: ${flexDirection};`}
  ${({ alignItems }) => alignItems && `align-items: ${alignItems};`}
  ${({ justifyContent }) => justifyContent && `justify-content: ${justifyContent};`}
  ${({ gap }) => gap && `gap: ${tokens.spacing[gap as keyof typeof tokens.spacing]};`}
  ${({ width }) => width && `width: ${width};`}
  ${({ height }) => height && `height: ${height};`}
  ${({ minHeight }) => minHeight && `min-height: ${minHeight};`}
  ${({ maxWidth }) => maxWidth && `max-width: ${maxWidth};`}
  ${({ overflow }) => overflow && `overflow: ${overflow};`}
  ${({ zIndex }) => zIndex && `z-index: ${zIndex};`}
`;

export const Flex = styled(Box)`
  display: flex;
`;

export const Grid = styled(Box)<{
  columns?: number;
  rows?: number;
  templateColumns?: string;
  templateRows?: string;
}>`
  display: grid;
  ${({ columns }) => columns && `grid-template-columns: repeat(${columns}, 1fr);`}
  ${({ rows }) => rows && `grid-template-rows: repeat(${rows}, 1fr);`}
  ${({ templateColumns }) => templateColumns && `grid-template-columns: ${templateColumns};`}
  ${({ templateRows }) => templateRows && `grid-template-rows: ${templateRows};`}
`;

export const Container = styled(Box)<{
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  center?: boolean;
}>`
  width: 100%;
  ${({ center }) => center && 'margin-left: auto; margin-right: auto;'}
  
  ${({ size }) => {
    switch (size) {
      case 'sm': return `max-width: ${tokens.breakpoints.sm};`;
      case 'md': return `max-width: ${tokens.breakpoints.md};`;
      case 'lg': return `max-width: ${tokens.breakpoints.lg};`;
      case 'xl': return `max-width: ${tokens.breakpoints.xl};`;
      case '2xl': return `max-width: ${tokens.breakpoints['2xl']};`;
      case 'full': return 'max-width: 100%;';
      default: return `max-width: ${tokens.breakpoints.xl};`;
    }
  }}
`;

export const Text = styled(motion.span)<{
  size?: keyof typeof tokens.typography.fontSize;
  weight?: keyof typeof tokens.typography.fontWeight;
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: keyof typeof tokens.typography.lineHeight;
  letterSpacing?: keyof typeof tokens.typography.letterSpacing;
  gradient?: boolean;
  truncate?: boolean;
}>`
  font-family: ${tokens.typography.fontFamily.sans};
  ${({ size }) => size && `font-size: ${tokens.typography.fontSize[size]};`}
  ${({ weight }) => weight && `font-weight: ${tokens.typography.fontWeight[weight]};`}
  ${({ color }) => color && `color: ${color};`}
  ${({ align }) => align && `text-align: ${align};`}
  ${({ lineHeight }) => lineHeight && `line-height: ${tokens.typography.lineHeight[lineHeight]};`}
  ${({ letterSpacing }) => letterSpacing && `letter-spacing: ${tokens.typography.letterSpacing[letterSpacing]};`}
  ${({ gradient }) => gradient && css`
    background: ${tokens.colors.gradients.primary};
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  `}
  ${({ truncate }) => truncate && css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `}
`;

export const Card = styled(motion.div)<{
  variant?: 'elevated' | 'outlined' | 'glass' | 'gradient';
  padding?: number;
  hover?: boolean;
  clickable?: boolean;
}>`
  border-radius: ${tokens.borderRadius['2xl']};
  transition: all ${tokens.transitions.base};
  position: relative;
  overflow: hidden;
  
  ${({ variant = 'elevated' }) => {
    switch (variant) {
      case 'elevated':
        return css`
          background: ${tokens.colors.neutral[0]};
          box-shadow: ${tokens.shadows.base};
          border: 1px solid ${tokens.colors.neutral[200]};
        `;
      case 'outlined':
        return css`
          background: ${tokens.colors.neutral[0]};
          border: 2px solid ${tokens.colors.neutral[200]};
        `;
      case 'glass':
        return css`
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        `;
      case 'gradient':
        return css`
          background: ${tokens.colors.gradients.primary};
          color: white;
        `;
      default:
        return css`
          background: ${tokens.colors.neutral[0]};
          box-shadow: ${tokens.shadows.base};
        `;
    }
  }}
  
  ${({ padding = 6 }) => `padding: ${tokens.spacing[padding as keyof typeof tokens.spacing]};`}
  
  ${({ hover }) => hover && css`
    &:hover {
      transform: translateY(-4px);
      box-shadow: ${tokens.shadows.xl};
    }
  `}
  
  ${({ clickable }) => clickable && css`
    cursor: pointer;
    &:hover {
      transform: translateY(-2px);
      box-shadow: ${tokens.shadows.lg};
    }
    &:active {
      transform: translateY(0);
    }
  `}
`;

export const Button = styled(motion.button)<{
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${tokens.spacing[2]};
  font-family: ${tokens.typography.fontFamily.sans};
  font-weight: ${tokens.typography.fontWeight.semibold};
  border: none;
  border-radius: ${tokens.borderRadius.xl};
  cursor: pointer;
  transition: all ${tokens.transitions.base};
  position: relative;
  overflow: hidden;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }
  
  ${({ size = 'md' }) => {
    switch (size) {
      case 'sm':
        return css`
          padding: ${tokens.spacing[2]} ${tokens.spacing[4]};
          font-size: ${tokens.typography.fontSize.sm};
          min-height: 36px;
        `;
      case 'md':
        return css`
          padding: ${tokens.spacing[3]} ${tokens.spacing[6]};
          font-size: ${tokens.typography.fontSize.base};
          min-height: 44px;
        `;
      case 'lg':
        return css`
          padding: ${tokens.spacing[4]} ${tokens.spacing[8]};
          font-size: ${tokens.typography.fontSize.lg};
          min-height: 52px;
        `;
      case 'xl':
        return css`
          padding: ${tokens.spacing[5]} ${tokens.spacing[10]};
          font-size: ${tokens.typography.fontSize.xl};
          min-height: 60px;
        `;
    }
  }}
  
  ${({ variant = 'primary' }) => {
    switch (variant) {
      case 'primary':
        return css`
          background: ${tokens.colors.primary[500]};
          color: white;
          &:hover:not(:disabled) {
            background: ${tokens.colors.primary[600]};
            transform: translateY(-2px);
            box-shadow: ${tokens.shadows.lg};
          }
          &:active:not(:disabled) {
            transform: translateY(0);
          }
        `;
      case 'secondary':
        return css`
          background: ${tokens.colors.neutral[100]};
          color: ${tokens.colors.neutral[700]};
          border: 1px solid ${tokens.colors.neutral[300]};
          &:hover:not(:disabled) {
            background: ${tokens.colors.neutral[200]};
            transform: translateY(-2px);
          }
        `;
      case 'outline':
        return css`
          background: transparent;
          color: ${tokens.colors.primary[600]};
          border: 2px solid ${tokens.colors.primary[300]};
          &:hover:not(:disabled) {
            background: ${tokens.colors.primary[50]};
            border-color: ${tokens.colors.primary[500]};
            transform: translateY(-2px);
          }
        `;
      case 'ghost':
        return css`
          background: transparent;
          color: ${tokens.colors.neutral[600]};
          &:hover:not(:disabled) {
            background: ${tokens.colors.neutral[100]};
            color: ${tokens.colors.neutral[900]};
          }
        `;
      case 'gradient':
        return css`
          background: ${tokens.colors.gradients.primary};
          color: white;
          box-shadow: ${tokens.shadows.glow};
          &:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: ${tokens.shadows.glowLg};
          }
          &:active:not(:disabled) {
            transform: translateY(0);
          }
        `;
    }
  }}
  
  ${({ fullWidth }) => fullWidth && 'width: 100%;'}
`;

export const Input = styled(motion.input)<{
  variant?: 'default' | 'filled' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  leftIcon?: boolean;
  rightIcon?: boolean;
}>`
  width: 100%;
  font-family: ${tokens.typography.fontFamily.sans};
  border-radius: ${tokens.borderRadius.xl};
  transition: all ${tokens.transitions.base};
  border: 2px solid transparent;
  
  &:focus {
    outline: none;
    border-color: ${tokens.colors.primary[500]};
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
  
  &::placeholder {
    color: ${tokens.colors.neutral[400]};
  }
  
  ${({ size = 'md' }) => {
    switch (size) {
      case 'sm':
        return css`
          padding: ${tokens.spacing[2]} ${tokens.spacing[3]};
          font-size: ${tokens.typography.fontSize.sm};
          min-height: 36px;
        `;
      case 'md':
        return css`
          padding: ${tokens.spacing[3]} ${tokens.spacing[4]};
          font-size: ${tokens.typography.fontSize.base};
          min-height: 44px;
        `;
      case 'lg':
        return css`
          padding: ${tokens.spacing[4]} ${tokens.spacing[5]};
          font-size: ${tokens.typography.fontSize.lg};
          min-height: 52px;
        `;
    }
  }}
  
  ${({ variant = 'default' }) => {
    switch (variant) {
      case 'default':
        return css`
          background: ${tokens.colors.neutral[0]};
          border-color: ${tokens.colors.neutral[300]};
          &:hover {
            border-color: ${tokens.colors.neutral[400]};
          }
        `;
      case 'filled':
        return css`
          background: ${tokens.colors.neutral[100]};
          border-color: transparent;
          &:hover {
            background: ${tokens.colors.neutral[200]};
          }
          &:focus {
            background: ${tokens.colors.neutral[0]};
          }
        `;
      case 'outline':
        return css`
          background: transparent;
          border-color: ${tokens.colors.neutral[300]};
          &:hover {
            border-color: ${tokens.colors.neutral[400]};
          }
        `;
    }
  }}
  
  ${({ error }) => error && css`
    border-color: ${tokens.colors.error[500]} !important;
    &:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
  `}
  
  ${({ leftIcon }) => leftIcon && `padding-left: ${tokens.spacing[12]};`}
  ${({ rightIcon }) => rightIcon && `padding-right: ${tokens.spacing[12]};`}
`;

// Animation variants
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
};

export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};
