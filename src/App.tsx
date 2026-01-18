import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import {
  Dashboard,
  Customers,
  CustomerDetail,
  DocumentList,
  DocumentDetail,
  DocumentEditor,
  Settings,
  Products,
  Reports,
  Expenses,
  ExpenseEditor,
  ExpenseDetail,
  Memos,
  ExpenseSplits,
  ExpenseSplitEditor,
  Login,
} from './pages';

// Protected routes wrapper
function ProtectedRoutes() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/quotations" element={<DocumentList type="quotation" />} />
        <Route path="/quotations/new" element={<DocumentEditor type="quotation" mode="create" />} />
        <Route path="/quotations/:id" element={<DocumentDetail type="quotation" />} />
        <Route path="/quotations/:id/edit" element={<DocumentEditor type="quotation" mode="edit" />} />
        <Route path="/invoices" element={<DocumentList type="invoice" />} />
        <Route path="/invoices/new" element={<DocumentEditor type="invoice" mode="create" />} />
        <Route path="/invoices/:id" element={<DocumentDetail type="invoice" />} />
        <Route path="/invoices/:id/edit" element={<DocumentEditor type="invoice" mode="edit" />} />
        <Route path="/receipts" element={<DocumentList type="receipt" />} />
        <Route path="/receipts/new" element={<DocumentEditor type="receipt" mode="create" />} />
        <Route path="/receipts/:id" element={<DocumentDetail type="receipt" />} />
        <Route path="/receipts/:id/edit" element={<DocumentEditor type="receipt" mode="edit" />} />
        <Route path="/products" element={<Products />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/expenses/new" element={<ExpenseEditor mode="create" />} />
        <Route path="/expenses/:id" element={<ExpenseDetail />} />
        <Route path="/expenses/:id/edit" element={<ExpenseEditor mode="edit" />} />
        <Route path="/expense-splits" element={<ExpenseSplits />} />
        <Route path="/expense-splits/new" element={<ExpenseSplitEditor mode="create" />} />
        <Route path="/expense-splits/:id" element={<ExpenseSplitEditor mode="edit" />} />
        <Route path="/memos" element={<Memos />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppProvider>
            <BrowserRouter basename={import.meta.env.BASE_URL}>
              <ProtectedRoutes />
            </BrowserRouter>
          </AppProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
