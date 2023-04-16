import { createRoot } from 'react-dom/client';
import Layout from './Layout';


const App = () => {
    return (
        <div>
            <Layout />
        </div>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);