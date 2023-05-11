import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import EditorPage from "./pages/EditorPage";
import HomePage from "./pages/HomePage";
import Login from "./auth/Login";
import Header from "./layout/Header";
import SignUp from "./auth/Signup";
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from "./auth/auth";
import { RequireAuth } from "./auth/RequireAuth";


const App = () => {


  return (
    <Router>
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/editor" element={<RequireAuth><EditorPage /></RequireAuth>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;