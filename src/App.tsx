import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { Layout } from './components/layout/Layout';
import {
  Dashboard,
  Customers,
  DocumentList,
  DocumentDetail,
  DocumentEditor,
  Settings,
  Products,
  Reports,
} from './pages';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            {/* Dashboard */}
            <Route path="/" element={<Dashboard />} />

            {/* Customers */}
            <Route path="/customers" element={<Customers />} />

            {/* Quotations */}
            <Route path="/quotations" element={<DocumentList type="quotation" />} />
            <Route path="/quotations/new" element={<DocumentEditor type="quotation" mode="create" />} />
            <Route path="/quotations/:id" element={<DocumentDetail type="quotation" />} />
            <Route path="/quotations/:id/edit" element={<DocumentEditor type="quotation" mode="edit" />} />

            {/* Invoices */}
            <Route path="/invoices" element={<DocumentList type="invoice" />} />
            <Route path="/invoices/new" element={<DocumentEditor type="invoice" mode="create" />} />
            <Route path="/invoices/:id" element={<DocumentDetail type="invoice" />} />
            <Route path="/invoices/:id/edit" element={<DocumentEditor type="invoice" mode="edit" />} />

            {/* Receipts */}
            <Route path="/receipts" element={<DocumentList type="receipt" />} />
            <Route path="/receipts/new" element={<DocumentEditor type="receipt" mode="create" />} />
            <Route path="/receipts/:id" element={<DocumentDetail type="receipt" />} />
            <Route path="/receipts/:id/edit" element={<DocumentEditor type="receipt" mode="edit" />} />

            {/* Products */}
            <Route path="/products" element={<Products />} />

            {/* Reports */}
            <Route path="/reports" element={<Reports />} />

            {/* Settings */}
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
