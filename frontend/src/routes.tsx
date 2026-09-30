import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { RequireProfileComplete } from './auth/RequireProfileComplete';

import Login from './pages/Login';

// Citizen
import CitizenLayout from './components/CitizenLayout';
import SubmitRequest from './pages/citizen/SubmitRequest';
import Confirmation from './pages/citizen/Confirmation';
import MyRequests from './pages/citizen/MyRequests';
import TrackRequest from './pages/citizen/TrackRequest';
import Register from './pages/citizen/Register';
import RegisterSuccess from './pages/citizen/RegisterSuccess';
import Settings from './pages/citizen/Settings';

// Officer
import OfficerLayout from './components/OfficerLayout';
import Overview from './pages/officer/Overview';
import Recommendations from './pages/officer/Recommendations';
import HotspotMap from './pages/officer/HotspotMap';

import GapAnalysis from './pages/officer/GapAnalysis';
import BudgetSimulator from './pages/officer/BudgetSimulator';
import PolicyBrief from './pages/officer/PolicyBrief';
import ImpactTracker from './pages/officer/ImpactTracker';

// Admin
import AdminLayout from './components/AdminLayout';
import Datasets from './pages/admin/Datasets';
import Regions from './pages/admin/Regions';
import Users from './pages/admin/Users';

// Placeholders for anything not yet built
// const Placeholder = ({ title }: { title: string }) => <div className="p-8">{title} - Coming soon</div>;

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/citizen',
    element: <ProtectedRoute allowedRoles={['citizen']} />,
    children: [
      {
        element: <RequireProfileComplete />,
        children: [
          { path: 'register', element: <Register /> },
          { path: 'success', element: <RegisterSuccess /> },
          {
            element: <CitizenLayout />,
            children: [
              { index: true, element: <SubmitRequest /> },
              { path: 'confirmation/:id', element: <Confirmation /> },
              { path: 'requests', element: <MyRequests /> },
              { path: 'requests/:id', element: <TrackRequest /> },
              { path: 'settings', element: <Settings /> },
            ]
          }
        ]
      }
    ],
  },
  {
    path: '/officer',
    element: <ProtectedRoute allowedRoles={['officer']} />,
    children: [
      {
        element: <OfficerLayout />,
        children: [
          { index: true, element: <Overview /> },
          { path: 'hotspots', element: <HotspotMap /> },
          { path: 'gaps', element: <GapAnalysis /> },
          { path: 'recommendations', element: <Recommendations /> },
          { path: 'simulator', element: <BudgetSimulator /> },
          { path: 'policy', element: <PolicyBrief /> },
          { path: 'impact', element: <ImpactTracker /> },
        ]
      }
    ],
  },
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <Datasets /> },
          { path: 'regions', element: <Regions /> },
          { path: 'users', element: <Users /> },
        ]
      }
    ],
  }
]);
