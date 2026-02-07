import { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import LoginPage from './pages/LoginPage';
import SetupPage from './pages/SetupPage';
import MainPage from './pages/MainPage';

function App() {
  const { view, setView, setError } = useAppStore();

  useEffect(() => {
    // 检查是否已设置主密码
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const hasUser = await window.electronAPI.checkSetup();
      if (hasUser) {
        setView('login');
      } else {
        setView('setup');
      }
    } catch (error) {
      setError('初始化失败，请重启应用');
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50">
      {view === 'setup' && <SetupPage key="setup" />}
      {view === 'login' && <LoginPage key={`login-${Date.now()}`} />}
      {view === 'main' && <MainPage key="main" />}
    </div>
  );
}

export default App;
