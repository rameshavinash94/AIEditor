import React, { useState } from "react";
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from "./auth";


function Login() {
    const [email, setEmail] = useState();
    const [password, setPassword] = useState();
    const [loading, setLoading] = useState(false);
    const auth = useAuth();
    const navigate = useNavigate();

    function handleLogin(e) {
        e.preventDefault();
        setLoading(true);

        auth.login("Yash");
        navigate("/editor");
        setLoading(false);
    }
    return (
        <div className='container d-flex flex-row justify-content-center align-items-center' style={{ height: '100vh' }}>
            <div className='card col-5 shadow p-3' id='login_container'>
                <form className='p-3' onSubmit={(e) => handleLogin(e)}>
                    <div className='row'>
                        <div className='col'>
                            <div className='text-center p-3'>
                                <h3 className='mb-3'> Log In </h3>
                            </div>
                        </div>
                    </div>


                    <div className='row'>
                        <div className='form-floating mb-3'>
                            <input
                                type='email'
                                id='email'
                                name='email'
                                placeholder='Enter Registered Email ID'
                                value={email}
                                required={true}
                                autoFocus={true}
                                onChange={(e) => setEmail(e.target.value)}
                                className='form-control'
                            />
                            <label htmlFor='email' className='ms-2'>
                                Email ID
                            </label>
                        </div>


                        <div className='form-floating mb-3'>
                            <input
                                type='password'
                                id='password'
                                name='password'
                                placeholder='Enter your password'
                                value={password}
                                required={true}
                                autoFocus={true}
                                onChange={(e) => setPassword(e.target.value)}
                                className='form-control'
                            />
                            <label htmlFor='password' className='ms-2'>
                                Password
                            </label>
                        </div>
                    </div>


                    <div className='row my-3'>
                        <div className='col-12 text-right'>
                            <NavLink
                                to='/forgotPassword'
                                className='font-13'
                                style={{ color: '#666666' }}
                            >
                                <i className='dripicons-lock'></i> Forgot password?
                            </NavLink>
                        </div>
                    </div>


                    <div className='text-center'>
                        <button className="btn btn-primary px-3 py-1 mt-2" type='submit' disabled={loading}>
                            {loading && <span className='spinner-border spinner-border-sm me-1'></span>}Login
                        </button>
                    </div>
                </form>

                <div className='mx-3 my-1 text-center' style={{ color: '#666666' }}>
                    <p className='mb-0'>
                        Don't have an account?
                        <NavLink to='/signup' className='text-primary ms-2'>
                            Sign Up
                        </NavLink>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login;