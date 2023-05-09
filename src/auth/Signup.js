import React, { useState } from "react";
import { NavLink } from 'react-router-dom';


function SignUp() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    function getCode(e) {
        e.preventDefault();
        setLoading(true);
        setLoading(false);
    }
    return (
        <>
            <div className='row' style={{ height: '100vh', maxHeight: '100vh' }}>
                <div
                    className='col-md-auto overflow-auto'
                    style={{ height: '100vh', maxHeight: '100vh' }}
                >
                    <form className='p-3' onSubmit={(e) => getCode(e)}>
                        <div className='row'>
                            <div className='col'>
                                <div className='text-center p-3'>
                                    <h3 className='mb-3'> Sign Up </h3>
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

                            <div className='form-floating mb-3'>
                                <input
                                    type='confirmPassword'
                                    id='confirmPassword'
                                    name='confirmPassword'
                                    placeholder='Confirm your Password'
                                    value={confirmPassword}
                                    required={true}
                                    autoFocus={true}
                                    onChange={(e) => setConfimmPassword(e.target.value)}
                                    className='form-control'
                                />
                                <label htmlFor='password' className='ms-2'>
                                    Confirm Password
                                </label>
                            </div>
                        </div>


                        <div className='text-center'>
                            <button className="btn btn-primary px-3 py-1 mt-2" type='submit' disabled={loading}>
                                {loading && <span className='spinner-border spinner-border-sm me-1'></span>}Login
                            </button>
                        </div>
                    </form>

                    <div className='pt-4 pb-3 text-center' style={{ color: '#666666' }}>
                        <p className='mb-0'>
                            Already have an account?
                            <NavLink to='/login' className='text-primary ms-2'>
                                Log In
                            </NavLink>
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default SignUp;