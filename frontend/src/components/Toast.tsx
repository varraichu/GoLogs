// File: src/components/Toast.tsx
import { h } from 'preact';
import { useToast } from '../context/ToastContext';

const Toast = () => {
  const { messageDataProvider, removeToast } = useToast();

  const closeMessage = (event: CustomEvent<{ key: string }>) => {
    removeToast(event.detail.key);
  };

  return (
    <oj-c-message-toast
      data={messageDataProvider}
      onojClose={closeMessage}
      position="top-right"
      offset={{ horizontal: 10, vertical: 50 }}
    />
  );
};

export default Toast;
