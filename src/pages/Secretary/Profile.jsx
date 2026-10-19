import { jsx as _jsx } from "react/jsx-runtime";
import AdminProfile from '../Admin/Profile';
import './Profile.css';
function Profile() {
    return _jsx(AdminProfile, { audience: "secretary" });
}
export default Profile;
