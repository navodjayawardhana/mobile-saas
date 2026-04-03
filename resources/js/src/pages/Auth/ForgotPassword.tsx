import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForgotPasswordMutation } from '../../store/api/authApi';

const ForgotPassword = () => {
    const [forgotPassword, { isLoading, error, isSuccess }] = useForgotPasswordMutation();

    const [email, setEmail] = useState('');
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const errors: Record<string, string> = {};
        if (!email) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            errors.email = 'Email is invalid';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            await forgotPassword({ email }).unwrap();
        } catch (err: any) {
            if (err?.data?.errors) {
                setFormErrors(err.data.errors);
            }
        }
    };

    const getErrorMessage = () => {
        if (error && 'data' in error) {
            return (error.data as any)?.message || 'Failed to send reset link';
        }
        return null;
    };

    useEffect(() => {
        document.title = 'Forgot Password | Mobile Shop';
    }, []);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[url('/assets/images/map.svg')] bg-cover bg-center dark:bg-[url('/assets/images/map-dark.svg')]">
            <div className="panel m-6 w-full max-w-lg sm:w-[480px]">
                <h2 className="mb-3 text-2xl font-bold">Forgot Password</h2>
                <p className="mb-7">Enter your email address and we'll send you a link to reset your password</p>

                {isSuccess ? (
                    <div className="text-center">
                        <div className="mb-5 rounded-md bg-success-light p-4 text-success">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="font-semibold">Reset link sent!</p>
                            <p className="text-sm mt-1">Check your email for a link to reset your password.</p>
                        </div>
                        <Link
                            to="/login"
                            className="btn btn-primary w-full"
                        >
                            Back to Sign In
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
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    className={`form-input ${formErrors.email ? 'border-danger' : ''}`}
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (formErrors.email) {
                                            setFormErrors({});
                                        }
                                    }}
                                />
                                {formErrors.email && (
                                    <span className="text-danger text-xs mt-1">{formErrors.email}</span>
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
                                {isLoading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPassword;
