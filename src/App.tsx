import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './pages/auth/Login';
import NotFound from './pages/NotFound';
import AdminDashboard from './pages/admin/AdminDashboard';
import Users from './pages/admin/Users';
import Regions from './pages/admin/Regions';
import LeadApprovals from './pages/admin/LeadApprovals';
import AllLeads from './pages/admin/AllLeads';
import GeneralPoolAdmin from './pages/admin/GeneralPoolAdmin';
import BulkUpload from './pages/admin/BulkUpload';
import LeadAssignment from './pages/admin/LeadAssignment';
import UserDashboard from './pages/user/UserDashboard';
import CreateLead from './pages/user/CreateLead';
import MyLeads from './pages/user/MyLeads';
import LeadDetail from './pages/user/LeadDetail';
import GeneralPool from './pages/user/GeneralPool';
import RootRedirect from './components/layout/RootRedirect';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<Users />} />
              <Route path="/admin/regions" element={<Regions />} />
              <Route path="/admin/approvals" element={<LeadApprovals />} />
              <Route path="/admin/all-leads" element={<AllLeads />} />
              <Route path="/admin/pool" element={<GeneralPoolAdmin />} />
              <Route path="/admin/bulk-upload" element={<BulkUpload />} />
              <Route path="/admin/lead-assignment" element={<LeadAssignment />} /> {/* Added LeadAssignment route */}
            </Route>

            {/* Shared Routes (Accessible by all roles) */}
            <Route path="/leads/:id" element={<LeadDetail />} />

            {/* User Routes */}
            <Route element={<ProtectedRoute allowedRoles={['distributor', 'user']} />}>
              <Route path="/user/dashboard" element={<UserDashboard />} />
              <Route path="/user/create-lead" element={<CreateLead />} />
              <Route path="/user/leads" element={<MyLeads />} />
              <Route path="/user/pool" element={<GeneralPool />} />
            </Route>
          </Route>

          {/* Root Redirect - redirects based on user role */}
          <Route path="/" element={<RootRedirect />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </QueryClientProvider>
  );
}

export default App;
