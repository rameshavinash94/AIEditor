import React from "react";
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from "../auth/auth";
import logo from "../AIEditorlogo.png";
import {
  IconButton,
} from "@mui/material";
const Header = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.logout();
    navigate("/login");
  }
  
  return (
    <nav className='navbar navbar-dark bg-dark navbar-expand-lg'>
      <div className='container-fluid'>
        <NavLink className='navbar-brand' to='/'>
        <IconButton edge="start" color="inherit" aria-label="logo" sx={{ mr: 2 }}>
          <img src={logo} alt="EditScape Logo" height="40" />
        </IconButton>
        </NavLink>
        <button className='navbar-toggler' type='button' data-bs-toggle='collapse' data-bs-target='#navbarNavAltMarkup' aria-controls='navbarNavAltMarkup' aria-expanded='false' aria-label='Toggle navigation'>
          <span className='navbar-toggler-icon'></span>
        </button>
        <div className='collapse navbar-collapse' id='navbarNavAltMarkup'>
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            
          </ul>
          <div className="d-flex">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">

              {
                !auth.user ? (<>
                  <li className="nav-item">
                    <NavLink className='nav-link' to='/login'>Login</NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className='nav-link' to='/signup'>Sign Up</NavLink>
                  </li>
                </>) : (
                  <button className="btn btn-primary px-3 py-1 mt-2" onClick={handleLogout}>
                    Logout
                  </button>
                )
              }
            </ul>
          </div>
        </div>
      </div>
    </nav >
  );
};

export default Header;
