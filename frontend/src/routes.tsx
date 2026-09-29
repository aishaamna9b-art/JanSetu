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

// Officer (placeholders for phase 1/2)
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
      { index: true, element: <Placeholder title="Officer Overview" /> }
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
