import React from "react";
import { NavLink } from 'react-router-dom';
import logo from "../AIEditorlogo.png"; // Import the logo image

const Header = () => {
  return (
    <nav className='navbar navbar-dark bg-dark navbar-expand-lg'>
      <div className='container-fluid'>
        <NavLink className='navbar-brand' to='/'>AI Audio/Video Editor</NavLink>
        <button className='navbar-toggler' type='button' data-bs-toggle='collapse' data-bs-target='#navbarNavAltMarkup' aria-controls='navbarNavAltMarkup' aria-expanded='false' aria-label='Toggle navigation'>
          <span className='navbar-toggler-icon'></span>
        </button>
        <div className='collapse navbar-collapse' id='navbarNavAltMarkup'>
        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <NavLink className='nav-link' to='/editor'>Edit</NavLink>
              </li>
            </ul>
          <div className="d-flex">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <NavLink className='nav-link' to='/login'>Login</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className='nav-link' to='/signup'>Sign Up</NavLink>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav >
  );
};

export default Header;
