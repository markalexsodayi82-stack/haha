import { Dashboard } from '../pages/Dashboard.jsx';
export default function AdminApp(props) { return <Dashboard {...props} user={{...props.user, role:'admin'}} />; }
