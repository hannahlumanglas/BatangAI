import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useState } from 'react';
import './AppDialog.css';
const AppDialogContext = createContext(null);
export function AppDialogProvider({ children }) {
    const [requests, setRequests] = useState([]);
    const enqueue = useCallback((kind, message, title) => new Promise(resolve => {
        setRequests(current => [...current, {
                kind,
                title: title || (kind === 'confirm' ? 'Please confirm' : 'Notice'),
                message,
                resolve,
            }]);
    }), []);
    const showAlert = useCallback(async (message, title) => {
        await enqueue('alert', message, title);
    }, [enqueue]);
    const showConfirm = useCallback((message, title) => enqueue('confirm', message, title), [enqueue]);
    const active = requests[0];
    const finish = (confirmed) => {
        if (!active)
            return;
        active.resolve(confirmed);
        setRequests(current => current.slice(1));
    };
    return (_jsxs(AppDialogContext.Provider, { value: { showAlert, showConfirm }, children: [children, active && (_jsx("div", { className: "app-dialog-backdrop", onMouseDown: event => {
                    if (event.target === event.currentTarget)
                        finish(false);
                }, children: _jsxs("section", { className: "app-dialog", role: active.kind === 'confirm' ? 'alertdialog' : 'dialog', "aria-modal": "true", "aria-labelledby": "app-dialog-title", "aria-describedby": "app-dialog-message", children: [_jsx("div", { className: "app-dialog-mark", "aria-hidden": "true", children: active.kind === 'confirm' ? '?' : 'i' }), _jsx("h2", { id: "app-dialog-title", children: active.title }), _jsx("p", { id: "app-dialog-message", children: active.message }), _jsxs("div", { className: "app-dialog-actions", children: [active.kind === 'confirm' && (_jsx("button", { className: "app-dialog-button app-dialog-button--secondary", type: "button", onClick: () => finish(false), children: "Cancel" })), _jsx("button", { className: "app-dialog-button app-dialog-button--primary", type: "button", autoFocus: true, onClick: () => finish(true), children: active.kind === 'confirm' ? 'Confirm' : 'OK' })] })] }) }))] }));
}
export function useAppDialog() {
    const context = useContext(AppDialogContext);
    if (!context)
        throw new Error('useAppDialog must be used inside AppDialogProvider.');
    return context;
}
