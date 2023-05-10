import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import EditorPage from "./pages/EditorPage";
import HomePage from "./pages/HomePage";
import Login from "./auth/Login";
import Header from "./layout/Header";
import SignUp from "./auth/Signup";
import 'react-toastify/dist/ReactToastify.css';


const App = () => {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/" element={<HomePage />} />
      </Routes>
    </Router>
  );
};

export default App;