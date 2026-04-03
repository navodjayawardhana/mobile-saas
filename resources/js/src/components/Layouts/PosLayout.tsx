import { PropsWithChildren, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import App from '../../App';
import Portals from '../../components/Portals';

const PosLayout = ({ children }: PropsWithChildren) => {
    const [showLoader, setShowLoader] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const screenLoader = document.getElementsByClassName('screen_loader');
        if (screenLoader?.length) {
            screenLoader[0].classList.add('animate__fadeOut');
            setTimeout(() => {
                setShowLoader(false);
            }, 200);
        }

        // Update time every minute
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <App>
            <div className="relative min-h-screen bg-[#f4f4f4] dark:bg-[#060818]">
                {/* screen loader */}
                {showLoader && (
                    <div className="screen_loader fixed inset-0 bg-[#fafafa] dark:bg-[#060818] z-[60] grid place-content-center animate__animated">
                        <svg width="64" height="64" viewBox="0 0 135 135" xmlns="http://www.w3.org/2000/svg" fill="#4361ee">
                            <path d="M67.447 58c5.523 0 10-4.477 10-10s-4.477-10-10-10-10 4.477-10 10 4.477 10 10 10zm9.448 9.447c0 5.523 4.477 10 10 10 5.522 0 10-4.477 10-10s-4.478-10-10-10c-5.523 0-10 4.477-10 10zm-9.448 9.448c-5.523 0-10 4.477-10 10 0 5.522 4.477 10 10 10s10-4.478 10-10c0-5.523-4.477-10-10-10zM58 67.447c0-5.523-4.477-10-10-10s-10 4.477-10 10 4.477 10 10 10 10-4.477 10-10z">
                                <animateTransform attributeName="transform" type="rotate" from="0 67 67" to="-360 67 67" dur="2.5s" repeatCount="indefinite" />
                            </path>
                        </svg>
                    </div>
                )}

                {/* POS Header */}
                <div className="bg-white dark:bg-[#1b2e4b] shadow-sm border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between px-4 py-3">
                        {/* Left: Exit Button */}
                        <Link
                            to="/sales"
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span className="font-medium">Exit POS</span>
                        </Link>

                        {/* Center: Title */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                    <line x1="1" y1="10" x2="23" y2="10"></line>
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-800 dark:text-white">Point of Sale</h1>
                                <p className="text-xs text-gray-500">Quick Sales Terminal</p>
                            </div>
                        </div>

                        {/* Right: Time & Date */}
                        <div className="text-right">
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{formatTime(currentTime)}</p>
                            <p className="text-sm text-gray-500">{formatDate(currentTime)}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <Suspense>
                    <div className="p-4 h-[calc(100vh-73px)]">
                        {children}
                    </div>
                </Suspense>

                <Portals />
            </div>
        </App>
    );
};

export default PosLayout;
