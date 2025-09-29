import React from 'react';
import { Modal, ModalProps } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';

// 包装Ant Design Modal以添加动画效果
interface AnimatedModalProps extends ModalProps {
  children: React.ReactNode;
}

export const AnimatedModal: React.FC<AnimatedModalProps> = ({ 
  open, 
  children, 
  ...modalProps 
}) => {
  return (
    <AnimatePresence>
      {open && (
        <Modal
          {...modalProps}
          open={open}
          destroyOnClose
          maskClosable={false}
          style={{ 
            top: '20%',
            ...modalProps.style 
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8
            }}
          >
            {children}
          </motion.div>
        </Modal>
      )}
    </AnimatePresence>
  );
};
