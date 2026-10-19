import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { getAuthSession, signIn } from '../../auth';
import './Login.css';
function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    useEffect(() => {
        const role = getAuthSession()?.user.role;
        if (!role)
            return;
        const destinations = {
            Administrator: '/admin',
            Secretary: '/secretary/incidents',
            'IT Personnel': '/it/incidents',
            Employee: '/employee/report-incident',
        };
        navigate(destinations[role], { replace: true });
    }, [navigate]);
    const handleLogin = async (event) => {
        event.preventDefault();
        setErrorMessage('');
        if (!email.trim() || !password) {
            setErrorMessage('Invalid email or password.');
            return;
        }
        const result = await signIn(email.trim(), password, rememberMe);
        if (!result.session) {
            setErrorMessage(result.message);
            return;
        }
        const destinations = {
            Administrator: '/admin',
            Secretary: '/secretary/incidents',
            'IT Personnel': '/it/incidents',
            Employee: '/employee/report-incident',
        };
        navigate(destinations[result.session.user.role]);
    };
    return (_jsx("main", { className: "login-page", children: _jsxs("section", { className: "login-card", "aria-labelledby": "login-heading", children: [_jsxs("header", { className: "login-heading", children: [_jsx("img", { className: "login-logo", src: logo, alt: "Batangas City seal" }), _jsxs("h2", { id: "login-heading", children: ["Batang", _jsx("span", { children: "AI" })] }), _jsx("p", { children: "AI-Integrated Network Incident Reporting and Troubleshooting Support System" })] }), _jsxs("form", { className: "login-form", onSubmit: handleLogin, children: [_jsxs("div", { className: "login-field", children: [_jsx("label", { htmlFor: "email", children: "Email Address" }), _jsxs("div", { className: "input-wrap", children: [_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "8", r: "3.25" }), _jsx("path", { d: "M5.5 19c.6-3.3 3.04-5 6.5-5s5.9 1.7 6.5 5" })] }), _jsx("input", { id: "email", name: "email", type: "email", autoComplete: "email", placeholder: "Enter your email address", value: email, onChange: (event) => setEmail(event.target.value), required: true })] })] }), _jsxs("div", { className: "login-field", children: [_jsx("label", { htmlFor: "password", children: "Password" }), _jsxs("div", { className: "input-wrap password-wrap", children: [_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("rect", { x: "5.5", y: "10", width: "13", height: "10", rx: "1.5" }), _jsx("path", { d: "M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" }), _jsx("path", { d: "M12 14v2" })] }), _jsx("input", { id: "password", name: "password", type: showPassword ? 'text' : 'password', autoComplete: "current-password", placeholder: "Enter your password", value: password, onChange: (event) => setPassword(event.target.value), required: true }), _jsx("button", { className: "password-toggle", type: "button", onClick: () => setShowPassword((visible) => !visible), children: showPassword ? 'Hide' : 'Show' })] })] }), _jsxs("div", { className: "login-options", children: [_jsxs("label", { className: "remember-me", children: [_jsx("input", { type: "checkbox", name: "remember", checked: rememberMe, onChange: (event) => setRememberMe(event.target.checked) }), _jsx("span", { children: "Remember me" })] }), _jsx("a", { href: "#forgot-password", children: "Forgot password?" })] }), _jsxs("button", { className: "login-button", type: "submit", children: [_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("rect", { x: "6.5", y: "10.5", width: "11", height: "9", rx: "1.4" }), _jsx("path", { d: "M9 10.5v-2a3 3 0 0 1 6 0v2M12 14v2" })] }), "Login"] }), errorMessage && (_jsx("p", { role: "alert", "aria-live": "assertive", style: {
                                color: '#c62f2f',
                                fontSize: '13px',
                                margin: '-7px 0 0',
                            }, children: errorMessage }))] }), _jsxs("footer", { className: "login-footer", children: [_jsx("span", {}), _jsxs("p", { children: [_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M12 3 19 6v5c0 4.4-2.8 7.45-7 9-4.2-1.55-7-4.6-7-9V6l7-3Z" }), _jsx("path", { d: "m8.7 12 2.05 2.05 4.55-4.65" })] }), "Authorized personnel"] }), _jsx("span", {})] })] }) }));
}
export default Login;
