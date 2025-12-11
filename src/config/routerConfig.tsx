import { BrowserRouter } from 'react-router-dom';
import { App } from '../App';

export const Router = () => {
  console.log('✅ Router component rendering...');
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <App />
    </BrowserRouter>
  );
}; 