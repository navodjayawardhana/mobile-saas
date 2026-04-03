import Swal from 'sweetalert2';

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    },
});

export const showToast = {
    success: (message: string) => {
        Toast.fire({
            icon: 'success',
            title: message,
        });
    },
    error: (message: string) => {
        Toast.fire({
            icon: 'error',
            title: message,
        });
    },
    warning: (message: string) => {
        Toast.fire({
            icon: 'warning',
            title: message,
        });
    },
    info: (message: string) => {
        Toast.fire({
            icon: 'info',
            title: message,
        });
    },
};

export default Toast;
