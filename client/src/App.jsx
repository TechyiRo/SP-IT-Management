import React from 'react';
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
import AdminInventory from './pages/admin/Inventory';
import AdminTracking from './pages/admin/Tracking';
import AdminResources from './pages/admin/AdminResources';
import Payroll from './pages/admin/Payroll';

// Placeholder Pages
import EmployeeDashboard from './pages/employee/Dashboard';
import EmployeeAttendance from './pages/employee/Attendance';
import EmployeeTasks from './pages/employee/Tasks';
import TaskDetails from './pages/employee/TaskDetails';
import EmployeeWorkLog from './pages/employee/WorkLog';

import EmployeeResources from './pages/employee/Resources';
import MySalary from './pages/employee/MySalary';

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
        <Route path="resources" element={<AdminResources />} />
        <Route path="products" element={<Products />} />
        <Route path="companies" element={<Companies />} />
        <Route path="work-details" element={<WorkDetails />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="tracking" element={<AdminTracking />} />
        <Route path="payroll" element={<Payroll />} />
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
        <Route path="resources" element={
          user?.permissions?.canAccessResources ? <EmployeeResources /> : <Navigate to="/employee" replace />
        } />
        <Route path="salary" element={<MySalary />} />
      </Route>
    </Routes>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-white bg-slate-900 min-h-screen">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Something went wrong.</h1>
          <pre className="bg-black/30 p-4 rounded text-sm overflow-auto">
            {this.state.error && this.state.error.toString()}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </AuthProvider>
    </Router>
  );
}

export default App;
