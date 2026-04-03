import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useResetPasswordMutation } from '../../store/api/authApi';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [resetPassword, { isLoading, error, isSuccess }] = useResetPasswordMutation();

    const token = searchParams.get('token') || '';
    const email = searchParams.get('email') || '';

    const [formData, setFormData] = useState({
        password: '',
        password_confirmation: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const errors: Record<string, string> = {};

        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        }
        if (formData.password !== formData.password_confirmation) {
            errors.password_confirmation = 'Passwords do not match';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            await resetPassword({
                email,
                token,
                password: formData.password,
                password_confirmation: formData.password_confirmation,
            }).unwrap();
        } catch (err: any) {
            if (err?.data?.errors) {
                setFormErrors(err.data.errors);
            }
        }
    };

    const getErrorMessage = () => {
        if (error && 'data' in error) {
            return (error.data as any)?.message || 'Failed to reset password';
        }
        return null;
    };

    useEffect(() => {
        document.title = 'Reset Password | Mobile Shop';
    }, []);

    // If no token or email, show error
    if (!token || !email) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[url('/assets/images/map.svg')] bg-cover bg-center dark:bg-[url('/assets/images/map-dark.svg')]">
                <div className="panel m-6 w-full max-w-lg sm:w-[480px] text-center">
                    <div className="mb-5 rounded-md bg-danger-light p-4 text-danger">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        <p className="font-semibold">Invalid Reset Link</p>
                        <p className="text-sm mt-1">The password reset link is invalid or has expired.</p>
                    </div>
                    <Link
                        to="/forgot-password"
                        className="btn btn-primary w-full"
                    >
                        Request New Link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[url('/assets/images/map.svg')] bg-cover bg-center dark:bg-[url('/assets/images/map-dark.svg')]">
            <div className="panel m-6 w-full max-w-lg sm:w-[480px]">
                <h2 className="mb-3 text-2xl font-bold">Reset Password</h2>
                <p className="mb-7">Enter your new password below</p>

                {isSuccess ? (
                    <div className="text-center">
                        <div className="mb-5 rounded-md bg-success-light p-4 text-success">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="font-semibold">Password Reset Successful!</p>
                            <p className="text-sm mt-1">Your password has been reset successfully.</p>
                        </div>
                        <Link
                            to="/login"
                            className="btn btn-primary w-full"
                        >
                            Sign In
                        </Link>
                    </div>
                ) : (
                    <>
                        {getErrorMessage() && (
                            <div className="mb-5 rounded-md bg-danger-light p-3.5 text-danger">
                                {getErrorMessage()}
                            </div>
                        )}

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="password">New Password</label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        className={`form-input pr-10 ${formErrors.password ? 'border-danger' : ''}`}
                                        placeholder="Enter new password"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {formErrors.password && (
                                    <span className="text-danger text-xs mt-1">{formErrors.password}</span>
                                )}
                            </div>

                            <div>
                                <label htmlFor="password_confirmation">Confirm New Password</label>
                                <div className="relative">
                                    <input
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        className={`form-input pr-10 ${formErrors.password_confirmation ? 'border-danger' : ''}`}
                                        placeholder="Confirm new password"
                                        value={formData.password_confirmation}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {formErrors.password_confirmation && (
                                    <span className="text-danger text-xs mt-1">{formErrors.password_confirmation}</span>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>
                                ) : null}
                                {isLoading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>

                        <div className="relative my-7 h-5 text-center before:absolute before:inset-0 before:m-auto before:h-[1px] before:w-full before:bg-[#ebedf2] dark:before:bg-[#253b5c]">
                            <div className="relative z-[1] inline-block bg-white px-2 font-bold text-white-dark dark:bg-[#0e1726]">
                                <span>OR</span>
                            </div>
                        </div>

                        <p className="text-center">
                            Remember your password?{' '}
                            <Link
                                to="/login"
                                className="font-bold text-primary hover:underline"
                            >
                                Sign In
                            </Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
