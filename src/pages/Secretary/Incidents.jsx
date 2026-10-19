import { jsx as _jsx } from "react/jsx-runtime";
import AdminIncidents from '../Admin/Incidents';
import './Incidents.css';
function Incidents() {
    return _jsx(AdminIncidents, { audience: "secretary" });
}
export default Incidents;
