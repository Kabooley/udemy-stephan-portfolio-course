import React from 'react';
import { createRoot } from 'react-dom/client';
import Layout from './Layout';


const App = () => {
    return (
        <div>
            <Layout />
        </div>
    );
};

if(!document.getElementById('root')) {
    console.error("Error: No root element!");
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);