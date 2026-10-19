import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../apiConfig';
export function useOffices() {
    const [offices, setOffices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        let active = true;
        fetch(`${API_BASE_URL}/offices.php`)
            .then(async (response) => {
            const data = await response.json();
            if (!response.ok || !data.success || !Array.isArray(data.offices)) {
                throw new Error(data.message || 'Unable to load offices.');
            }
            if (active)
                setOffices(data.offices);
        })
            .catch(reason => {
            if (active)
                setError(reason instanceof Error ? reason.message : 'Unable to load offices.');
        })
            .finally(() => { if (active)
            setLoading(false); });
        return () => { active = false; };
    }, []);
    return { offices, loading, error };
}
