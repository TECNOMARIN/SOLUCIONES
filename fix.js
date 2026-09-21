const fs = require('fs');
let content = fs.readFileSync('src/main.jsx', 'utf8');

const targetStr = `                const canAccessTab = (modId, tab            const fetchUsersLocal = useCallback(async () => {`;

const replaceStr = `                const canAccessTab = (modId, tabId) => {
                    if (isGlobalAdmin) return true;
                    if (!modulosPermitidos[modId]) return false;
                    const allowedTabs = pestanasPermitidas[modId] || [];
                    return allowedTabs.includes('TODAS') || allowedTabs.includes(tabId);
                };

                setUserPerms({
                    isGlobalAdmin,
                    isRegionalAdmin: uName.startsWith('admin-'),
                    isSemiAdmin: uName.startsWith('cia'),
                    isTesoreria: uName === 'tesoreria' || uName === 'tesorería',
                    hasPrivileges,
                    userType,
                    un: user.un || user.UN || user.UnidaddeNegocio || user['UNIDAD DE NEGOCIO'] || user['Unidad de Negocio'] || '',
                    modulos: modulosPermitidos,
                    pestanas: pestanasPermitidas,
                    canAccessModule,
                    canAccessTab
                });
            }, [db.config_permisos]);

            const fetchUsersLocal = useCallback(async () => {`;

content = content.replace(targetStr, replaceStr);

const dupeStart = `          if (retries > 0) await new Promise(r => setTimeout(r, 1500));
                        else {
                            console.error("Fetch Data Error:", error);
                            showToast("Error de conexión. Intenta de nuevo.", "error");
                        }
                    }
                }
                setLoading(false);
                setInitialLoading(false);
            }, [showToast]);

            useEffect(() => {
                fetchUsersLocal();
            }, [fetchUsersLocal]);

            useEffect(() => {
                if (currentUser) {
                    setupPermissions(currentUser, db.config_permisos);
                }
            }, [currentUser, db.config_permisos, setupPermissions]);

            useEffect(() => {
                if (currentUser) {
                    const interval = setInterval(() => { fetchData(false); }, 300000);
                    return () => clearInterval(interval);
                }
            }, [currentUser, fetchData]);`;

content = content.replace(dupeStart, '');

fs.writeFileSync('src/main.jsx', content);
