import { createUserWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { NavLink } from 'react-router-dom';
import { firebaseauth } from "./firebaseauth";
import { ToastContainer, toast } from 'react-toastify';


function SignUp() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    function getCode(e) {
        e.preventDefault();
        setLoading(true);

        if (password === confirmPassword) {
            createUserWithEmailAndPassword(firebaseauth, email, confirmPassword).then((res) => {
                toast.success("Sign Up successfull");
            }).catch((err) => {
                toast.error("something went wrong");
            })
        }



        setLoading(false);
    }
    return (
        <div className='container d-flex flex-row justify-content-center align-items-center' style={{ height: '100vh' }}>
            <div className='card col-5 shadow p-3' id='login_container'>
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
                                type='password'
                                id='confirmPassword'
                                name='confirmPassword'
                                placeholder='Confirm your Password'
                                value={confirmPassword}
                                required={true}
                                autoFocus={true}
                                onChange={(e) => setConfirmPassword(e.target.value)}
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
            <ToastContainer
                position='bottom-right'
                autoClose={3000}
                hideProgressBar={true}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                pauseOnHover
            />
        </div>
    )
}

export default SignUp;