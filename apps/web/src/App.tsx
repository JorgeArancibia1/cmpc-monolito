import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/features/analytics/DashboardPage';
import { AdminRoute } from '@/features/auth/AdminRoute';
import { ChangePasswordPage } from '@/features/auth/ChangePasswordPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { BookDetailPage } from '@/features/books/BookDetailPage';
import { BookFormPage } from '@/features/books/BookFormPage';
import { BooksListPage } from '@/features/books/BooksListPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/books" element={<BooksListPage />} />
          <Route path="/books/:id" element={<BookDetailPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/books/new" element={<BookFormPage />} />
            <Route path="/books/:id/edit" element={<BookFormPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/books" replace />} />
      <Route path="*" element={<Navigate to="/books" replace />} />
    </Routes>
  );
}
