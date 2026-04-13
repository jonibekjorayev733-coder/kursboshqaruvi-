import { Navigate } from 'react-router-dom';
import { useAppContext } from '@/contexts/AppContext';

export default function Index() {
  const { role } = useAppContext();

  switch (role) {
    case 'student': return <Navigate to="/student" replace />;
    case 'teacher': return <Navigate to="/teacher" replace />;
    case 'admin': return <Navigate to="/admin" replace />;
    default: return <Navigate to="/student" replace />;
  }
}
