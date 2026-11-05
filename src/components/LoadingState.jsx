import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './LoadingState.css';

function LoadingState({ label = 'Loading...', variant = 'panel', rows = 3 }) {
    if (variant === 'skeleton') {
        return _jsx("span", { className: "app-loading-skeleton-bar", "aria-hidden": "true" });
    }

    if (variant === 'inline') {
        return (_jsxs("span", { className: "app-loading-inline", role: "status", "aria-live": "polite", "aria-busy": "true", children: [_jsx("span", { className: "app-loading-spinner", "aria-hidden": "true" }), _jsx("span", { children: label })] }));
    }

    return (_jsxs("div", { className: `app-loading app-loading--${variant}`, role: "status", "aria-live": "polite", "aria-busy": "true", children: [_jsxs("div", { className: "app-loading-message", children: [_jsx("span", { className: "app-loading-spinner", "aria-hidden": "true" }), _jsx("span", { children: label })] }), variant !== 'page' && (_jsx("div", { className: "app-loading-skeleton-list", "aria-hidden": "true", children: Array.from({ length: rows }, (_, index) => _jsxs("div", { className: "app-loading-skeleton-row", children: [_jsx("span", { className: "app-loading-skeleton-avatar" }), _jsxs("span", { className: "app-loading-skeleton-lines", children: [_jsx("span", {}), _jsx("span", {})] })] }, index)) }))] }));
}

export default LoadingState;
