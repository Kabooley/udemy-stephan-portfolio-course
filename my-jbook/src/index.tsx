import ReactDOM from 'react-dom';
import Editor from './components/editor';


const App = () => {
    return (
        <div>
            <Editor />
        </div>
    );
};

ReactDOM.render(<App />, document.querySelector('#root'));