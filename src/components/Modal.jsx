export function Modal({ open, title, children, onClose }) { if (!open) return null; return <div className="modal-backdrop-custom"><div className="modal-card"><div className="panel-head"><h5>{title}</h5><button className="btn-close" onClick={onClose} /></div>{children}</div></div>; }
export default Modal;
