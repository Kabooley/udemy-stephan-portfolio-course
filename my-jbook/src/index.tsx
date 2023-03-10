import { createRoot } from 'react-dom/client';
import Editor from './components/editor';


const App = () => {
    return (
        <div>
            <Editor />
        </div>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);