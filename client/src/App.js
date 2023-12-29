import './App.css';
import Dashboard from './modules/Dashboard';
import SignIn from './modules/Form/SignIn';
import SignUp from './modules/Form/SignUp';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "react-hot-toast";

const ProtectedRoute = ({ children, auth=false }) => {
  const isLoggedIn = localStorage.getItem('user:token') !== null || false;

  if(!isLoggedIn && auth) {
    return <Navigate to={'/users/sign_in'} />
  }else if(isLoggedIn && ['/users/sign_in', '/users/sign_up'].includes(window.location.pathname)){
    console.log('object :>> ');
    return <Navigate to={'/'} />
  }

  return children
}

function App() {
  return (
    <Router>
      <Toaster />
    <Routes>
      <Route path='/' element={
        <ProtectedRoute auth={true}>
          <Dashboard/>
        </ProtectedRoute>
      } />
      <Route path='/users/sign_in' element={
      <ProtectedRoute>
        <SignIn />
      </ProtectedRoute>
      } />
      <Route path='/users/sign_up' element={
        <ProtectedRoute>
        <SignUp />
      </ProtectedRoute>
      } />
    </Routes>
    </Router>
  );
}

export default App;
