import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import EmployeeLayout from './layouts/EmployeeLayout';
import Users from './pages/admin/Users';
import AdminDashboard from './pages/admin/Dashboard';
import Attendance from './pages/admin/Attendance';
import Tasks from './pages/admin/Tasks';
import Products from './pages/admin/Products';
import Companies from './pages/admin/Companies';
import WorkDetails from './pages/admin/WorkDetails';
import AdminTaskDetails from './pages/admin/TaskDetails';

// Placeholder Pages
import EmployeeDashboard from './pages/employee/Dashboard';
import EmployeeAttendance from './pages/employee/Attendance';
import EmployeeTasks from './pages/employee/Tasks';
import TaskDetails from './pages/employee/TaskDetails';
import EmployeeWorkLog from './pages/employee/WorkLog';

import EmployeeResources from './pages/employee/Resources';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  if (!isAuthenticated) return <Navigate to="/login" />;

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} />;
  }

  return children;
};

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} /> : <Login />
      } />

      <Route path="/" element={<Navigate to="/login" />} />

      {/* Admin Routes */}
      <Route path="/admin/*" element={
        <ProtectedRoute allowedRole="admin">
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="tasks/:id" element={<AdminTaskDetails />} />
        <Route path="products" element={<Products />} />
        <Route path="companies" element={<Companies />} />
        <Route path="work-details" element={<WorkDetails />} />
      </Route>

      {/* Employee Routes */}
      <Route path="/employee/*" element={
        <ProtectedRoute allowedRole="employee">
          <EmployeeLayout />
        </ProtectedRoute>
      }>
        <Route index element={<EmployeeDashboard />} />
        <Route path="attendance" element={<EmployeeAttendance />} />
        <Route path="tasks" element={<EmployeeTasks />} />
        <Route path="tasks/:id" element={<TaskDetails />} />
        <Route path="work-log" element={<EmployeeWorkLog />} />
        <Route path="resources" element={<EmployeeResources />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
