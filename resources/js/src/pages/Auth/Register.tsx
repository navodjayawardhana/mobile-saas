import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRegisterMutation } from '../../store/api/authApi';

const Register = () => {
    const navigate = useNavigate();
    const [register, { isLoading, error }] = useRegisterMutation();

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        shop_name: '',
        name: '',
        email: '',
        phone: '',
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

    const validateStep1 = () => {
        const errors: Record<string, string> = {};

        if (!formData.shop_name) {
            errors.shop_name = 'Shop name is required';
        }
        if (!formData.name) {
            errors.name = 'Your name is required';
        }
        if (!formData.email) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Email is invalid';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateStep2 = () => {
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

    const handleNext = () => {
        if (validateStep1()) {
            setCurrentStep(2);
        }
    };

    const handleBack = () => {
        setCurrentStep(1);
        setFormErrors({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep2()) return;

        try {
            await register(formData).unwrap();
            navigate('/', { replace: true });
        } catch (err: any) {
            if (err?.data?.errors) {
                setFormErrors(err.data.errors);
                // If there are errors in step 1 fields, go back to step 1
                const step1Fields = ['shop_name', 'name', 'email', 'phone'];
                const hasStep1Errors = step1Fields.some(field => err.data.errors[field]);
                if (hasStep1Errors) {
                    setCurrentStep(1);
                }
            }
        }
    };

    const getErrorMessage = () => {
        if (error && 'data' in error) {
            return (error.data as any)?.message || 'Registration failed';
        }
        return null;
    };

    useEffect(() => {
        document.title = 'Register | Mobile Shop';
    }, []);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[url('/assets/images/map.svg')] bg-cover bg-center dark:bg-[url('/assets/images/map-dark.svg')]">
            <div className="panel m-6 w-full max-w-lg sm:w-[480px]">
                <h2 className="mb-3 text-2xl font-bold">Create Your Shop</h2>
                <p className="mb-5">Enter your details to create your mobile shop account</p>

                {/* Step Indicator */}
                <div className="mb-7">
                    <div className="flex items-center justify-center">
                        <div className="flex items-center">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${currentStep >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                                1
                            </div>
                            <span className={`ml-2 text-sm font-medium ${currentStep >= 1 ? 'text-primary' : 'text-gray-500'}`}>
                                Shop Info
                            </span>
                        </div>
                        <div className={`mx-4 h-0.5 w-16 ${currentStep >= 2 ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                        <div className="flex items-center">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${currentStep >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                                2
                            </div>
                            <span className={`ml-2 text-sm font-medium ${currentStep >= 2 ? 'text-primary' : 'text-gray-500'}`}>
                                Password
                            </span>
                        </div>
                    </div>
                </div>

                {getErrorMessage() && (
                    <div className="mb-5 rounded-md bg-danger-light p-3.5 text-danger">
                        {getErrorMessage()}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Step 1: Shop & Personal Info */}
                    {currentStep === 1 && (
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="shop_name">Shop Name</label>
                                <input
                                    id="shop_name"
                                    name="shop_name"
                                    type="text"
                                    className={`form-input ${formErrors.shop_name ? 'border-danger' : ''}`}
                                    placeholder="Enter your shop name"
                                    value={formData.shop_name}
                                    onChange={handleChange}
                                />
                                {formErrors.shop_name && (
                                    <span className="text-danger text-xs mt-1">{formErrors.shop_name}</span>
                                )}
                            </div>

                            <div>
                                <label htmlFor="name">Your Name</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    className={`form-input ${formErrors.name ? 'border-danger' : ''}`}
                                    placeholder="Enter your name"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                                {formErrors.name && (
                                    <span className="text-danger text-xs mt-1">{formErrors.name}</span>
                                )}
                            </div>

                            <div>
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    className={`form-input ${formErrors.email ? 'border-danger' : ''}`}
                                    placeholder="Enter email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                                {formErrors.email && (
                                    <span className="text-danger text-xs mt-1">{formErrors.email}</span>
                                )}
                            </div>

                            <div>
                                <label htmlFor="phone">Phone (Optional)</label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    className="form-input"
                                    placeholder="Enter phone number"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>

                            <button
                                type="button"
                                className="btn btn-primary w-full"
                                onClick={handleNext}
                            >
                                Next
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Step 2: Password Setup */}
                    {currentStep === 2 && (
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="password">Password</label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        className={`form-input pr-10 ${formErrors.password ? 'border-danger' : ''}`}
                                        placeholder="Enter password"
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
                                <label htmlFor="password_confirmation">Confirm Password</label>
                                <div className="relative">
                                    <input
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        className={`form-input pr-10 ${formErrors.password_confirmation ? 'border-danger' : ''}`}
                                        placeholder="Confirm password"
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

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    className="btn btn-outline-primary w-full"
                                    onClick={handleBack}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                    </svg>
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary w-full"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block align-middle mr-2"></span>
                                    ) : null}
                                    {isLoading ? 'Creating...' : 'Create Shop'}
                                </button>
                            </div>
                        </div>
                    )}
                </form>

                <div className="relative my-7 h-5 text-center before:absolute before:inset-0 before:m-auto before:h-[1px] before:w-full before:bg-[#ebedf2] dark:before:bg-[#253b5c]">
                    <div className="relative z-[1] inline-block bg-white px-2 font-bold text-white-dark dark:bg-[#0e1726]">
                        <span>OR</span>
                    </div>
                </div>

                <p className="text-center">
                    Already have an account?{' '}
                    <Link
                        to="/login"
                        className="font-bold text-primary hover:underline"
                    >
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
