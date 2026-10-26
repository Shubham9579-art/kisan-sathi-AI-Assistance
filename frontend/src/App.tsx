
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './hooks/useLanguage';
import { AuthProvider } from './hooks/useAuth';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';

import { DashboardPage } from './pages/DashboardPage';
import { AssistantPage } from './pages/AssistantPage';
import { CropHealthPage } from './pages/CropHealthPage';
import { WeatherPage } from './pages/WeatherPage';
import { SchemesPage } from './pages/SchemesPage';
import { FieldsPage } from './pages/FieldsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AccountPage } from './pages/AccountPage';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';

const WeatherRoute: React.FC = () => {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <WeatherPage key={user?.id ?? 'guest'} />
    </div>
  );
};

export const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <LanguageProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
        <div className="app-shell min-h-screen flex flex-col text-gray-900 selection:bg-leaf-200">
          <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

          <div className="flex-1 flex max-w-7xl w-full mx-auto">
            <Sidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />

            <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/assistant" element={<AssistantPage />} />
                <Route path="/crop-health" element={<CropHealthPage />} />

                <Route
                  path="/weather"
                  element={<WeatherRoute />}
                />

                <Route path="/schemes" element={<SchemesPage />} />
                <Route path="/fields" element={<FieldsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/account" element={<AccountPage />} />
              </Routes>
            </main>
          </div>

          <Footer />
        </div>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </LanguageProvider>
  );
};

export default App;
