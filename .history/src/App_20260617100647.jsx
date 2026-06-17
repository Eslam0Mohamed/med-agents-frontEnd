import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import router from '';

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={route} />
    </AuthProvider>
  );
}

export default App;