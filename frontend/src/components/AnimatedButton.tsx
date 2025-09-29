import React from 'react';
import { Button, ButtonProps } from 'antd';
import { motion } from 'framer-motion';

// 带动画效果的按钮组件
interface AnimatedButtonProps extends ButtonProps {
  children: React.ReactNode;
  pulseOnClick?: boolean;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({ 
  children, 
  pulseOnClick = true,
  ...buttonProps 
}) => {
  return (
    <motion.div
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
      whileTap={{ 
        scale: pulseOnClick ? 0.95 : 1,
        transition: { duration: 0.1 }
      }}
      style={{ display: 'inline-block' }}
    >
      <Button 
        {...buttonProps}
        style={{
          ...buttonProps.style,
          transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)'
        }}
      >
        {children}
      </Button>
    </motion.div>
  );
};
