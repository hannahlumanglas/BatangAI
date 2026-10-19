import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../apiConfig';
export function useSystemOptions() {
    const [options, setOptions] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        let active = true;
        fetch(`${API_BASE_URL}/system_options.php`)
            .then(async (response) => {
            const data = await response.json();
            if (!response.ok || !data.success || !data.options) {
                throw new Error(data.message || 'Unable to load system options.');
            }
            if (active)
                setOptions(data.options);
        })
            .catch(reason => {
            if (active)
                setError(reason instanceof Error ? reason.message : 'Unable to load system options.');
        })
            .finally(() => { if (active)
            setLoading(false); });
        return () => { active = false; };
    }, []);
    return { options, loading, error };
}
