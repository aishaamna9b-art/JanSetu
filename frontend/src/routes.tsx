import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';

import Login from './pages/Login';

// Citizen
import CitizenLayout from './components/CitizenLayout';
import CitizenHome from './pages/citizen/Home';
import SubmitRequest from './pages/citizen/SubmitRequest';
import Confirmation from './pages/citizen/Confirmation';
import MyRequests from './pages/citizen/MyRequests';
import TrackRequest from './pages/citizen/TrackRequest';

// Officer
import OfficerLayout from './components/OfficerLayout';
import Overview from './pages/officer/Overview';
import Recommendations from './pages/officer/Recommendations';

// Admin (placeholders for phase 1/2)
const Placeholder = ({ title }: { title: string }) => <div className="p-8">{title} - Coming soon</div>;

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
        element: <CitizenLayout />,
        children: [
          { index: true, element: <CitizenHome /> },
          { path: 'submit', element: <SubmitRequest /> },
          { path: 'confirmation/:id', element: <Confirmation /> },
          { path: 'requests', element: <MyRequests /> },
          { path: 'requests/:id', element: <TrackRequest /> },
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
          { path: 'hotspots', element: <Placeholder title="Hotspot Map" /> },
          { path: 'gaps', element: <Placeholder title="Gap Analysis" /> },
          { path: 'recommendations', element: <Recommendations /> },
          { path: 'simulator', element: <Placeholder title="Budget Simulator" /> },
          { path: 'policy', element: <Placeholder title="Policy Brief" /> },
          { path: 'impact', element: <Placeholder title="Impact Tracker" /> },
        ]
      }
    ],
  },
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      { index: true, element: <Placeholder title="Admin Setup" /> }
    ],
  }
]);
