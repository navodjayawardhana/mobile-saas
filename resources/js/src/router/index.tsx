import { createBrowserRouter } from 'react-router-dom';
import BlankLayout from '../components/Layouts/BlankLayout';
import DefaultLayout from '../components/Layouts/DefaultLayout';
import PosLayout from '../components/Layouts/PosLayout';
import { routes } from './routes';

const getLayout = (layout: string | undefined, element: React.ReactNode) => {
    switch (layout) {
        case 'blank':
            return <BlankLayout>{element}</BlankLayout>;
        case 'pos':
            return <PosLayout>{element}</PosLayout>;
        default:
            return <DefaultLayout>{element}</DefaultLayout>;
    }
};

const finalRoutes = routes.map((route) => {
    return {
        ...route,
        element: getLayout(route.layout, route.element),
    };
});

const router = createBrowserRouter(finalRoutes);

export default router;
