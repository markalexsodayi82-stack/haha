export function Toast({ message, type='success', onClose }) { if (!message) return null; return <div className={`toast show text-bg-${type}`} role="alert"><div className="d-flex"><div className="toast-body">{message}</div><button className="btn-close btn-close-white me-2 m-auto" onClick={onClose} /></div></div>; }
export default Toast;
