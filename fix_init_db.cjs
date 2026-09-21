const fs = require('fs');
let code = fs.readFileSync('src/main.jsx', 'utf8');

const fetchUsersLocal = `
            const fetchUsersLocal = useCallback(async () => {
                const hasSession = !!sessionStorage.getItem('soluciones_user_session_v4');
                
                try {
                    const cachedDb = localStorage.getItem('soluciones_db_cache_v4');
                    if (cachedDb) {
                        setDb(JSON.parse(cachedDb));
                        setInitialLoading(false);
                        if (hasSession) {
                            fetchData(false);
                        }
                    } else {
                        // If no cache, fetch everything
                        fetchData(false);
                    }
                } catch(e) {
                   console.error("Failed to load local DB", e);
                   fetchData(false);
                }
            }, []);
`;

code = code.replace(
    /const fetchUsersLocal = useCallback\(async \(\) => \{[\s\S]*?\}, \[\]\);/,
    fetchUsersLocal
);

code = code.replace(
    /if \(resJson\.status === 'success' && resJson\.data\) \{[\s\S]*?setDb\(resJson\.data\);/,
    `if (resJson.status === 'success' && resJson.data) {
                            setDb(resJson.data);
                            localStorage.setItem('soluciones_db_cache_v4', JSON.stringify(resJson.data));`
);

fs.writeFileSync('src/main.jsx', code);
console.log("Updated to use localStorage for db cache");
