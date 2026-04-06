import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ReportForm from './pages/ReportForm';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<ReportForm />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
    </>
  );
}
