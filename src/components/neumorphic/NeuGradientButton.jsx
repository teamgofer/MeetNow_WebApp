import PropTypes from 'prop-types';
import React, { useState, useRef } from 'react';
import './neumorphic.css';

/**
 * Neumorphic Gradient Button component
 * A customizable button with gradient and animated effects
 */
const NeuGradientButton = ({
  children,
  icon,
  iconPosition = 'left',
  variant = 'default',
  size = 'medium',
  type = 'button',
  disabled = false,
  onClick,
  href,
  target,
  rel,
  gradientType = 'linear',
  gradientAngle = 45,
  startColor,
  endColor,
  pulse = false,
  ripple = false,
  sheen = false,
  animated = false,
  animationSpeed = 'normal',
  rounded = false,
  className = '',
  style = {},
}) => {
  // State for ripple effect
  const [rippleStyle, setRippleStyle] = useState({});
  const [showRipple, setShowRipple] = useState(false);
  const buttonRef = useRef(null);

  // Handle ripple effect on click
  const handleRipple = e => {
    if (!ripple || disabled) return;

    const button = buttonRef.current;
    if (!button) return;

    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    const rect = button.getBoundingClientRect();
    const left = e.clientX - rect.left - radius;
    const top = e.clientY - rect.top - radius;

    setRippleStyle({
      width: `${diameter}px`,
      height: `${diameter}px`,
      left: `${left}px`,
      top: `${top}px`,
    });

    setShowRipple(true);

    // Remove ripple after animation completes
    setTimeout(() => {
      setShowRipple(false);
    }, 600);
  };

  // Handle click event
  const handleClick = e => {
    handleRipple(e);

    if (onClick && !disabled) {
      onClick(e);
    }
  };

  // Get variant-specific gradient colors
  const getGradientColors = () => {
    if (startColor && endColor) {
      return { start: startColor, end: endColor };
    }

    switch (variant) {
      case 'primary':
        return { start: '#4776E6', end: '#8E54E9' };
      case 'success':
        return { start: '#11998e', end: '#38ef7d' };
      case 'danger':
        return { start: '#f5576c', end: '#f093fb' };
      case 'warning':
        return { start: '#FF8008', end: '#FFC837' };
      case 'info':
        return { start: '#2193b0', end: '#6dd5ed' };
      case 'ocean':
        return { start: '#1A2980', end: '#26D0CE' };
      case 'sunset':
        return { start: '#FF512F', end: '#DD2476' };
      case 'rainbow':
        return { start: 'rainbow-gradient-start', end: 'rainbow-gradient-end' };
      default:
        return { start: '#4776E6', end: '#8E54E9' };
    }
  };

  // Generate gradient style
  const generateGradientStyle = () => {
    const colors = getGradientColors();

    // For rainbow gradient (will be handled by CSS)
    if (variant === 'rainbow') {
      return {};
    }

    if (gradientType === 'linear') {
      return {
        background: `linear-gradient(${gradientAngle}deg, ${colors.start}, ${colors.end})`,
      };
    } else if (gradientType === 'radial') {
      return {
        background: `radial-gradient(circle, ${colors.start}, ${colors.end})`,
      };
    }

    return {};
  };

  // Get variant class
  const getVariantClass = () => {
    return `neu-gradient-button-${variant}`;
  };

  // Get size class
  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'neu-gradient-button-small';
      case 'large':
        return 'neu-gradient-button-large';
      default:
        return '';
    }
  };

  // Get animation speed class
  const getAnimationSpeedClass = () => {
    switch (animationSpeed) {
      case 'slow':
        return 'neu-gradient-animation-slow';
      case 'fast':
        return 'neu-gradient-animation-fast';
      default:
        return '';
    }
  };

  // Determine if we should render a button or anchor
  const Component = href ? 'a' : 'button';

  // Props for button or anchor
  const componentProps = {
    className: `
      neu-gradient-button 
      ${getVariantClass()} 
      ${getSizeClass()}
      ${pulse ? 'neu-gradient-button-pulse' : ''}
      ${sheen ? 'neu-gradient-button-sheen' : ''}
      ${animated ? 'neu-gradient-button-animated' : ''}
      ${getAnimationSpeedClass()}
      ${rounded ? 'neu-gradient-button-rounded' : ''}
      ${disabled ? 'neu-gradient-button-disabled' : ''}
      ${className}
    `,
    style: {
      ...generateGradientStyle(),
      ...style,
    },
    ref: buttonRef,
    onClick: handleClick,
    disabled: Component === 'button' ? disabled : undefined,
    'aria-disabled': disabled,
    ...(href
      ? {
          href: disabled ? undefined : href,
          target,
          rel: target === '_blank' ? rel || 'noopener noreferrer' : rel,
        }
      : {
          type,
        }),
  };

  return (
    <Component {...componentProps}>
      {showRipple && <span className="neu-gradient-button-ripple" style={rippleStyle} />}

      {icon && iconPosition === 'left' && (
        <span className="neu-gradient-button-icon neu-gradient-button-icon-left">{icon}</span>
      )}

      <span className="neu-gradient-button-content">{children}</span>

      {icon && iconPosition === 'right' && (
        <span className="neu-gradient-button-icon neu-gradient-button-icon-right">{icon}</span>
      )}

      {sheen && <span className="neu-gradient-button-sheen-effect" />}
    </Component>
  );
};

NeuGradientButton.propTypes = {
  /** Button text content */
  children: PropTypes.node.isRequired,
  /** Icon to display */
  icon: PropTypes.node,
  /** Position of the icon */
  iconPosition: PropTypes.oneOf(['left', 'right']),
  /** Styling variant */
  variant: PropTypes.oneOf([
    'default',
    'primary',
    'success',
    'danger',
    'warning',
    'info',
    'ocean',
    'sunset',
    'rainbow',
  ]),
  /** Size variant */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  /** Button type attribute */
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  /** Whether the button is disabled */
  disabled: PropTypes.bool,
  /** Click handler */
  onClick: PropTypes.func,
  /** href attribute for anchor rendering */
  href: PropTypes.string,
  /** target attribute for anchor rendering */
  target: PropTypes.string,
  /** rel attribute for anchor rendering */
  rel: PropTypes.string,
  /** Type of gradient */
  gradientType: PropTypes.oneOf(['linear', 'radial']),
  /** Angle of linear gradient in degrees */
  gradientAngle: PropTypes.number,
  /** Starting gradient color */
  startColor: PropTypes.string,
  /** Ending gradient color */
  endColor: PropTypes.string,
  /** Whether to add pulse animation */
  pulse: PropTypes.bool,
  /** Whether to add ripple effect on click */
  ripple: PropTypes.bool,
  /** Whether to add sheen effect */
  sheen: PropTypes.bool,
  /** Whether the gradient should be animated */
  animated: PropTypes.bool,
  /** Speed of the animation */
  animationSpeed: PropTypes.oneOf(['slow', 'normal', 'fast']),
  /** Whether to use rounded style */
  rounded: PropTypes.bool,
  /** Additional CSS class */
  className: PropTypes.string,
  /** Additional inline styles */
  style: PropTypes.object,
};

export default NeuGradientButton;
