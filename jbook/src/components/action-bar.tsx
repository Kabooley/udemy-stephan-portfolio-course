import { useActions } from '../hooks/use-actions';
import './action-bar.css';

interface ActionBarProps {
    id: string;
};

const ActionBar: React.FC<ActionBarProps> = ({ id }) => {
    const { moveCell, deleteCell } = useActions();

    return (
        <div className="action-bar">
            <button className="button is-primary is-small" onClick={() => moveCell(id, 'up')} >
                <span className="icon">
                    <i className="fas fa-arrow-up"></i>
                </span>
            </button>
            <button className="button is-primary is-small" onClick={() => moveCell(id, 'down')} >
                <span className="icon">
                    <i className="fas fa-arrow-up"></i>
                </span>
            </button>
            <button className="button is-primary is-small" onClick={() => deleteCell(id)} >
                <span className="icon">
                    <i className="fas fa-arrow-up"></i>
                </span>
            </button>
        </div>
    );
};

export default ActionBar;

/*
UI上のセルの削除または上下方向への移動をするボタンを持つコンポーネント

各操作でディスパッチする

*/ 