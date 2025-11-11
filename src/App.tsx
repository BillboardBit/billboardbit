import { BrowserRouter, Routes, Route } from 'react-router';
import { MainLayout } from '@/components/Layout';
import Header from '@/components/Header';
import MobileNav from '@/components/MobileNav';
import Home from '@/pages/Home';
import CreateBoard from '@/pages/CreateBoard';
import Dashboard from '@/pages/Dashboard';
import BoardDisplay from '@/pages/BoardDisplay';
import PaymentPage from '@/pages/PaymentPage';
import ZapMe from '@/pages/ZapMe';

function App() {
  return (
    <BrowserRouter basename="/billboardbit">
      <div className="flex min-h-screen flex-col pb-20 md:pb-0">
        <Header />
        <MainLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateBoard />} />
            <Route path="/dashboard/:boardId" element={<Dashboard />} />
            <Route path="/board/:boardId" element={<BoardDisplay />} />
            <Route path="/pay/:boardId" element={<PaymentPage />} />
            <Route path="/zapme" element={<ZapMe />} />
          </Routes>
        </MainLayout>
        <MobileNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
