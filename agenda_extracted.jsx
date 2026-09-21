const AgendaVisitasView = ({ db, currentUser, userPerms, apiCall, showToast, setActiveView }) => {
            const { useState, useEffect, useCallback, useMemo } = React;

            const [activeFilter, setActiveFilter] = useState('todas');
            const [searchTerm, setSearchTerm] = useState('');
            const [viewMode, setViewMode] = useState('list');
            const [filterCia, setFilterCia] = useState('todas');
            const [filterStartDate, setFilterStartDate] = useState('');
            const [filterEndDate, setFilterEndDate] = useState('');
            const [calendarDate, setCalendarDate] = useState(new Date());
            const [selectedTask, setSelectedTask] = useState(null);
            const [detailTab, setDetailTab] = useState('detalles');
            const [showNewTaskModal, setShowNewTaskModal] = useState(false);

            const [newTask, setNewTask] = useState({
                id_cliente: '',
                cliente_nombre: '',
                direccion: '',
                fecha_programada: new Date().toISOString().split('T')[0],
                hora_programada: '09:00',
                prioridad: 'Media',
                descripcion: '',
                checklist: [
                    { id: 1, text: 'Verificar exhibición y material POP de la tienda', completed: false },
                    { id: 2, text: 'Revisar inventario y disponibilidad de referencias', completed: false },
                    { id: 3, text: 'Reunión de alineación con encargado de tienda', completed: false },
                    { id: 4, text: 'Seguimiento a créditos pendientes y recaudo', completed: false },
                    { id: 5, text: 'Verificar estado de avisos y publicidad externa', completed: false }
                ]
            });

            const [geoLoc, setGeoLoc] = useState({ lat: null, lon: null, accuracy: null, loading: false, error: null });
            const [evidenceType, setEvidenceType] = useState('Fachada de Tienda');
            const [evidenceImg, setEvidenceImg] = useState('');
            const [evidenceNotes, setEvidenceNotes] = useState('');
            const [submittingEvidencia, setSubmittingEvidencia] = useState(false);

            const [checkinObs, setCheckinObs] = useState('');
            const [submittingAction, setSubmittingAction] = useState(false);

            const availableClientes = useMemo(() => {
                const list = db.clientes || [];
                if (userPerms?.isGlobalAdmin) return list;
                const myUN = String(userPerms?.un || '').trim().toLowerCase();
                if (!myUN) return list;
                return list.filter(c => {
                    const clientUN = String(c.un || c.UN || c.UnidaddeNegocio || c['UNIDAD DE NEGOCIO'] || '').trim().toLowerCase();
                    return clientUN === myUN;
                });
            }, [db.clientes, userPerms]);

            
            const unOptions = useMemo(() => {
                const s = new Set();
                (db.clientes || []).forEach(c => {
                    const un = String(c.un || c.UN || c.UnidaddeNegocio || c['UNIDAD DE NEGOCIO'] || '').trim();
                    if(un) s.add(un.toUpperCase());
                });
                return Array.from(s).sort();
            }, [db.clientes]);

            const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
            const getFirstDayOfMonth = (year, month) => {
                let day = new Date(year, month, 1).getDay() - 1;
                return day === -1 ? 6 : day;
            };

            const myTasks = useMemo(() => {
                const allTareas = db.trop_tareas || [];
                const comercialName = String(currentUser?.nombre_cliente || currentUser?.nombre || '').trim().toLowerCase();
                const comercialId = String(currentUser?.id_cliente || currentUser?.id || '').trim().toLowerCase();

                return allTareas.filter(t => {
                    if (!userPerms?.isGlobalAdmin) {
                        const taskComercialName = String(t.COMERCIAL_NOMBRE || t.comercial_nombre || '').trim().toLowerCase();
                        const taskComercialId = String(t.COMERCIAL_ID || t.comercial_id || '').trim().toLowerCase();
                        if (comercialName && taskComercialName && !taskComercialName.includes(comercialName) && !comercialName.includes(taskComercialName) && taskComercialId !== comercialId) {
                            return false;
                        }
                    }

                    const estado = String(t.ESTADO || t.estado || 'Pendiente').toLowerCase();
                    const todayStr = new Date().toISOString().split('T')[0];
                    const fechaProg = String(t.FECHA_PROGRAMADA || t.fecha_programada || '');

                    if (filterCia !== 'todas') {
                        const cli = (db.clientes || []).find(c => String(c.id_cliente || c.ID_CLIENTE) === String(t.ID_CLIENTE || t.id_cliente));
                        const un = String(cli?.un || cli?.UN || cli?.UnidaddeNegocio || cli?.['UNIDAD DE NEGOCIO'] || '').trim().toUpperCase();
                        if (un !== filterCia.toUpperCase()) return false;
                    }

                    if (filterStartDate && fechaProg < filterStartDate) return false;
                    if (filterEndDate && fechaProg > filterEndDate) return false;

                    if (activeFilter === 'hoy' && !fechaProg.includes(todayStr) && fechaProg !== todayStr) return false;
                    if (activeFilter === 'pendiente' && estado !== 'pendiente') return false;
                    if (activeFilter === 'proceso' && estado !== 'en proceso') return false;
                    if (activeFilter === 'completada' && estado !== 'completada') return false;

                    if (searchTerm.trim() !== '') {
                        const st = searchTerm.toLowerCase();
                        const cliente = String(t.CLIENTE_NOMBRE || t.cliente_nombre || '').toLowerCase();
                        const dir = String(t.DIRECCION || t.direccion || '').toLowerCase();
                        const desc = String(t.DESCRIPCION || t.descripcion || '').toLowerCase();
                        return cliente.includes(st) || dir.includes(st) || desc.includes(st);
                    }

                    return true;
                });
            }, [db.trop_tareas, currentUser, userPerms, activeFilter, searchTerm]);

            const captureGPS = useCallback(() => {
                if (!navigator.geolocation) {
                    setGeoLoc({ lat: null, lon: null, accuracy: null, loading: false, error: 'El navegador no soporta Geolocalización.' });
                    showToast('Geolocalización no soportada en este navegador.', 'error');
                    return;
                }
                setGeoLoc(prev => ({ ...prev, loading: true, error: null }));
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        setGeoLoc({
                            lat: pos.coords.latitude.toFixed(6),
                            lon: pos.coords.longitude.toFixed(6),
                            accuracy: pos.coords.accuracy ? pos.coords.accuracy.toFixed(1) : '10.0',
                            loading: false,
                            error: null
                        });
                    },
                    (err) => {
                        let errMsg = 'No se pudo obtener la ubicación GPS.';
                        if (err.code === err.PERMISSION_DENIED) errMsg = 'Permiso de GPS denegado por el usuario.';
                        else if (err.code === err.POSITION_UNAVAILABLE) errMsg = 'Ubicación GPS no disponible.';
                        else if (err.code === err.TIMEOUT) errMsg = 'Tiempo de espera agotado al consultar GPS.';
                        setGeoLoc({ lat: null, lon: null, accuracy: null, loading: false, error: errMsg });
                        showToast(errMsg, 'error');
                    },
                    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
                );
            }, [showToast]);

            useEffect(() => {
                if (selectedTask && (detailTab === 'evidencia' || detailTab === 'monitoreo')) {
                    captureGPS();
                }
            }, [detailTab, selectedTask, captureGPS]);

            const handleSelectClienteInNewTask = (clientId) => {
                const cli = availableClientes.find(c => String(c.id_cliente || c.ID_CLIENTE).trim() === String(clientId).trim());
                if (cli) {
                    setNewTask(prev => ({
                        ...prev,
                        id_cliente: cli.id_cliente || cli.ID_CLIENTE || '',
                        cliente_nombre: cli.nombre_cliente || cli.NOMBRE_CLIENTE || '',
                        direccion: cli.direccion || cli.DIRECCION || cli.tienda || ''
                    }));
                } else {
                    setNewTask(prev => ({ ...prev, id_cliente: clientId, cliente_nombre: '', direccion: '' }));
                }
            };

            const handleCreateTask = async (e) => {
                e.preventDefault();
                if (!newTask.id_cliente || !newTask.fecha_programada) {
                    showToast('Selecciona un cliente y la fecha programada.', 'error');
                    return;
                }

                const payload = {
                    comercial_id: currentUser?.id_cliente || currentUser?.id || 'CIA-001',
                    comercial_nombre: currentUser?.nombre_cliente || currentUser?.nombre || 'Comercial CIA',
                    id_cliente: newTask.id_cliente,
                    cliente_nombre: newTask.cliente_nombre,
                    direccion: newTask.direccion,
                    fecha_programada: newTask.fecha_programada,
                    hora_programada: newTask.hora_programada,
                    prioridad: newTask.prioridad,
                    estado: 'Pendiente',
                    descripcion: newTask.descripcion,
                    checklist_json: newTask.checklist
                };

                await apiCall('guardarTareaTrop', payload, 'Tarea de visita asignada correctamente.');
                setShowNewTaskModal(false);
                setNewTask({
                    id_cliente: '',
                    cliente_nombre: '',
                    direccion: '',
                    fecha_programada: new Date().toISOString().split('T')[0],
                    hora_programada: '09:00',
                    prioridad: 'Media',
                    descripcion: '',
                    checklist: [
                        { id: 1, text: 'Verificar exhibición y material POP de la tienda', completed: false },
                        { id: 2, text: 'Revisar inventario y disponibilidad de referencias', completed: false },
                        { id: 3, text: 'Reunión de alineación con encargado de tienda', completed: false },
                        { id: 4, text: 'Seguimiento a créditos pendientes y recaudo', completed: false },
                        { id: 5, text: 'Verificar estado de avisos y publicidad externa', completed: false }
                    ]
                });
            };

            const handleImageUpload = (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (file.size > 5 * 1024 * 1024) {
                    showToast('La imagen supera los 5MB. Elige una más liviana.', 'error');
                    return;
                }

                const reader = new FileReader();
                reader.onloadend = () => {
                    setEvidenceImg(reader.result);
                };
                reader.readAsDataURL(file);
            };

            const handleSaveEvidencia = async () => {
                if (!geoLoc.lat || !geoLoc.lon) {
                    showToast('Se requiere ubicación GPS para adjuntar evidencia. Haz clic en "Actualizar Coordenadas".', 'error');
                    return;
                }
                if (!evidenceImg) {
                    showToast('Selecciona o toma una fotografía como evidencia.', 'error');
                    return;
                }

                setSubmittingEvidencia(true);
                try {
                    const activeVisit = (db.trop_visitas || []).find(v => String(v.ID_TAREA || v.id_tarea).trim() === String(selectedTask.ID_TAREA || selectedTask.id_tarea).trim());
                    const payload = {
                        id_visita: activeVisit ? (activeVisit.ID_VISITA || activeVisit.id_visita) : '',
                        id_tarea: selectedTask.ID_TAREA || selectedTask.id_tarea,
                        comercial_id: currentUser?.id_cliente || currentUser?.id || 'CIA-001',
                        comercial_nombre: currentUser?.nombre_cliente || currentUser?.nombre || 'Comercial CIA',
                        id_cliente: selectedTask.ID_CLIENTE || selectedTask.id_cliente,
                        cliente_nombre: selectedTask.CLIENTE_NOMBRE || selectedTask.cliente_nombre,
                        latitud: geoLoc.lat,
                        longitud: geoLoc.lon,
                        accuracy: geoLoc.accuracy,
                        tipo_evidencia: evidenceType,
                        imagen_base64_o_url: evidenceImg,
                        notas: evidenceNotes
                    };

                    await apiCall('guardarEvidenciaTrop', payload, 'Evidencia con GPS registrada correctamente.');
                    setEvidenceImg('');
                    setEvidenceNotes('');
                } catch (err) {
                    showToast(err.message || 'Error al guardar la evidencia.', 'error');
                } finally {
                    setSubmittingEvidencia(false);
                }
            };

            const handleCheckIn = async () => {
                if (!geoLoc.lat || !geoLoc.lon) {
                    showToast('Obligatorio obtener GPS antes de Check-in.', 'error');
                    return;
                }

                setSubmittingAction(true);
                try {
                    const taskId = selectedTask.ID_TAREA || selectedTask.id_tarea;
                    const payload = {
                        id_tarea: taskId,
                        comercial_id: currentUser?.id_cliente || currentUser?.id || 'CIA-001',
                        comercial_nombre: currentUser?.nombre_cliente || currentUser?.nombre || 'Comercial CIA',
                        id_cliente: selectedTask.ID_CLIENTE || selectedTask.id_cliente,
                        cliente_nombre: selectedTask.CLIENTE_NOMBRE || selectedTask.cliente_nombre,
                        latitud: geoLoc.lat,
                        longitud: geoLoc.lon,
                        accuracy: geoLoc.accuracy,
                        fecha_programada: selectedTask.FECHA_PROGRAMADA || selectedTask.fecha_programada,
                        hora_programada: selectedTask.HORA_PROGRAMADA || selectedTask.hora_programada,
                        observaciones: checkinObs || 'Check-in realizado por comercial CIA'
                    };

                    await apiCall('registrarCheckInTrop', payload, 'Check-in registrado. Visita en proceso.');
                    setCheckinObs('');
                } catch (err) {
                    showToast(err.message || 'Error al realizar Check-in.', 'error');
                } finally {
                    setSubmittingAction(false);
                }
            };

            const handleCheckOut = async () => {
                if (!geoLoc.lat || !geoLoc.lon) {
                    showToast('Obligatorio obtener GPS antes de Check-out.', 'error');
                    return;
                }

                setSubmittingAction(true);
                try {
                    const taskId = selectedTask.ID_TAREA || selectedTask.id_tarea;
                    const activeVisit = (db.trop_visitas || []).find(v => String(v.ID_TAREA || v.id_tarea).trim() === String(taskId).trim() && String(v.ESTADO_VISITA || v.estado_visita) === 'En Proceso');

                    const payload = {
                        id_visita: activeVisit ? (activeVisit.ID_VISITA || activeVisit.id_visita) : '',
                        id_tarea: taskId,
                        latitud: geoLoc.lat,
                        longitud: geoLoc.lon,
                        accuracy: geoLoc.accuracy,
                        observaciones: checkinObs || 'Check-out realizado. Visita finalizada.'
                    };

                    await apiCall('registrarCheckOutTrop', payload, 'Check-out completado exitosamente.');
                    setCheckinObs('');
                } catch (err) {
                    showToast(err.message || 'Error al realizar Check-out.', 'error');
                } finally {
                    setSubmittingAction(false);
                }
            };

            const handleToggleChecklistItem = async (itemIndex) => {
                if (!selectedTask) return;
                let currentChecklist = [];
                try {
                    const rawCl = selectedTask.CHECKLIST_JSON || selectedTask.checklist_json || '[]';
                    currentChecklist = typeof rawCl === 'string' ? JSON.parse(rawCl) : rawCl;
                } catch (e) {
                    currentChecklist = [];
                }

                const updatedChecklist = currentChecklist.map((it, idx) => idx === itemIndex ? { ...it, completed: !it.completed } : it);

                const updatedTask = { ...selectedTask, CHECKLIST_JSON: updatedChecklist, checklist_json: updatedChecklist };
                setSelectedTask(updatedTask);

                const payload = {
                    id_tarea: selectedTask.ID_TAREA || selectedTask.id_tarea,
                    checklist_json: updatedChecklist
                };
                await apiCall('guardarTareaTrop', payload, 'Checklist actualizado.');
            };

            const [newChecklistText, setNewChecklistText] = useState('');
            const handleAddChecklistItem = async () => {
                if (!newChecklistText.trim() || !selectedTask) return;
                let currentChecklist = [];
                try {
                    const rawCl = selectedTask.CHECKLIST_JSON || selectedTask.checklist_json || '[]';
                    currentChecklist = typeof rawCl === 'string' ? JSON.parse(rawCl) : rawCl;
                } catch (e) { currentChecklist = []; }

                const newItem = { id: Date.now(), text: newChecklistText.trim(), completed: false };
                const updatedChecklist = [...currentChecklist, newItem];

                setSelectedTask({ ...selectedTask, CHECKLIST_JSON: updatedChecklist, checklist_json: updatedChecklist });
                setNewChecklistText('');

                const payload = {
                    id_tarea: selectedTask.ID_TAREA || selectedTask.id_tarea,
                    checklist_json: updatedChecklist
                };
                await apiCall('guardarTareaTrop', payload, 'Ítem agregado al checklist.');
            };

            const getTaskChecklist = (task) => {
                if (!task) return [];
                try {
                    const raw = task.CHECKLIST_JSON || task.checklist_json || '[]';
                    return typeof raw === 'string' ? JSON.parse(raw) : raw;
                } catch (e) {
                    return [];
                }
            };

            const metrics = useMemo(() => {
                const total = myTasks.length;
                const pendientes = myTasks.filter(t => String(t.ESTADO || t.estado).toLowerCase() === 'pendiente').length;
                const enProceso = myTasks.filter(t => String(t.ESTADO || t.estado).toLowerCase() === 'en proceso').length;
                const completadas = myTasks.filter(t => String(t.ESTADO || t.estado).toLowerCase() === 'completada').length;
                return { total, pendientes, enProceso, completadas };
            }, [myTasks]);

            const activeVisitForSelected = useMemo(() => {
                if (!selectedTask) return null;
                const taskId = selectedTask.ID_TAREA || selectedTask.id_tarea;
                return (db.trop_visitas || []).find(v => String(v.ID_TAREA || v.id_tarea).trim() === String(taskId).trim());
            }, [db.trop_visitas, selectedTask]);

            const evidencesForSelected = useMemo(() => {
                if (!selectedTask) return [];
                const taskId = selectedTask.ID_TAREA || selectedTask.id_tarea;
                return (db.trop_fotos_gps || []).filter(ev => String(ev.ID_TAREA || ev.id_tarea).trim() === String(taskId).trim());
            }, [db.trop_fotos_gps, selectedTask]);

            return (
                <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
                    <div className="bg-gradient-to-r from-[#2C4C8C] via-indigo-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
                            <Icon name="Calendar" size={240} />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-bold backdrop-blur-md mb-3 border border-white/20">
                                    <Icon name="MapPin" size={14} className="text-emerald-400" />
                                    <span>Módulo de Operación y Visitas CIA</span>
                                </div>
                                <h1 className="text-2xl md:text-3xl font-black tracking-tight">Agenda y Gestión de Visitas</h1>
                                <p className="text-indigo-200 text-sm mt-1 max-w-xl">
                                    Bienvenido, <strong className="text-white">{currentUser?.nombre_cliente || currentUser?.nombre || 'Comercial CIA'}</strong>. Organiza tus visitas a aliados comerciales, registra listas de verificación, evidencias fotográficas con GPS obligatorio y control de tiempos.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 shrink-0">
                                <button
                                    onClick={() => setShowNewTaskModal(true)}
                                    className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center gap-2 cursor-pointer"
                                >
                                    <Icon name="Plus" size={18} /> Nueva Tarea / Visita
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                <span className="text-xs font-bold text-indigo-200 block uppercase">Total Programadas</span>
                                <span className="text-2xl font-black text-white mt-1 block">{metrics.total}</span>
                            </div>
                            <div className="bg-amber-500/20 backdrop-blur-md rounded-2xl p-4 border border-amber-400/30">
                                <span className="text-xs font-bold text-amber-200 block uppercase">Pendientes</span>
                                <span className="text-2xl font-black text-amber-300 mt-1 block">{metrics.pendientes}</span>
                            </div>
                            <div className="bg-blue-500/20 backdrop-blur-md rounded-2xl p-4 border border-blue-400/30">
                                <span className="text-xs font-bold text-blue-200 block uppercase">En Proceso</span>
                                <span className="text-2xl font-black text-blue-300 mt-1 block">{metrics.enProceso}</span>
                            </div>
                            <div className="bg-emerald-500/20 backdrop-blur-md rounded-2xl p-4 border border-emerald-400/30">
                                <span className="text-xs font-bold text-emerald-200 block uppercase">Completadas</span>
                                <span className="text-2xl font-black text-emerald-300 mt-1 block">{metrics.completadas}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
                            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar w-full md:w-auto pb-1 md:pb-0">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${viewMode === 'list' ? 'bg-[#2C4C8C] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    <Icon name="List" size={14} className="inline mr-1" /> Lista
                                </button>
                                <button
                                    onClick={() => setViewMode('calendar_week')}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${viewMode === 'calendar_week' ? 'bg-[#2C4C8C] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    <Icon name="Calendar" size={14} className="inline mr-1" /> Semana
                                </button>
                                <button
                                    onClick={() => setViewMode('calendar_month')}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${viewMode === 'calendar_month' ? 'bg-[#2C4C8C] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    <Icon name="Grid" size={14} className="inline mr-1" /> Mes
                                </button>
                                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                            <button
                                onClick={() => setActiveFilter('todas')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${activeFilter === 'todas' ? 'bg-[#2C4C8C] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                Todas ({db.trop_tareas?.length || 0})
                            </button>
                            <button
                                onClick={() => setActiveFilter('hoy')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${activeFilter === 'hoy' ? 'bg-[#2C4C8C] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                <Icon name="Calendar" size={14} className="inline mr-1" /> Hoy
                            </button>
                            <button
                                onClick={() => setActiveFilter('pendiente')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${activeFilter === 'pendiente' ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                Pendientes ({metrics.pendientes})
                            </button>
                            <button
                                onClick={() => setActiveFilter('proceso')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${activeFilter === 'proceso' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                En Proceso ({metrics.enProceso})
                            </button>
                            <button
                                onClick={() => setActiveFilter('completada')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${activeFilter === 'completada' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                Completadas ({metrics.completadas})
                            </button>
                        </div>

                        <div className="relative w-full md:w-72">
                            <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar cliente o dirección..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <label className="text-xs font-bold text-slate-500 uppercase">Compañía (CIA):</label>
                            <select
                                value={filterCia}
                                onChange={e => setFilterCia(e.target.value)}
                                className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none flex-1 md:w-40"
                            >
                                <option value="todas">Todas</option>
                                {unOptions.map(un => (
                                    <option key={un} value={un}>{un}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <label className="text-xs font-bold text-slate-500 uppercase">Desde:</label>
                            <input 
                                type="date" 
                                value={filterStartDate} 
                                onChange={e => setFilterStartDate(e.target.value)}
                                className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none flex-1 md:w-auto"
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <label className="text-xs font-bold text-slate-500 uppercase">Hasta:</label>
                            <input 
                                type="date" 
                                value={filterEndDate} 
                                onChange={e => setFilterEndDate(e.target.value)}
                                className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none flex-1 md:w-auto"
                            />
                        </div>
                        {(filterStartDate || filterEndDate || filterCia !== 'todas') && (
                            <button 
                                onClick={() => { setFilterStartDate(''); setFilterEndDate(''); setFilterCia('todas'); }}
                                className="text-xs font-bold text-indigo-500 hover:text-indigo-700 underline"
                            >
                                Limpiar Filtros
                            </button>
                        )}
                    </div>
                </div>

                    {myTasks.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
                            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                                <Icon name="Calendar" size={32} />
                            </div>
                            <h3 className="text-lg font-black text-slate-800">No se encontraron tareas o visitas programadas</h3>
                            <p className="text-slate-500 text-sm max-w-md mx-auto">
                                {searchTerm ? 'Prueba ajustando el término de búsqueda.' : 'Puedes agregar una nueva tarea de visita haciendo clic en el botón "Nueva Tarea / Visita".'}
                            </p>
                            <button
                                onClick={() => setShowNewTaskModal(true)}
                                className="px-5 py-2.5 bg-[#2C4C8C] text-white font-bold text-xs uppercase rounded-xl hover:bg-indigo-900 transition-colors inline-flex items-center gap-2 cursor-pointer"
                            >
                                <Icon name="Plus" size={16} /> Crear Tarea
                            </button>
                        </div>
                    ) : (
                        <React.Fragment>
                        {viewMode === 'list' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myTasks.map((t, idx) => {
                                const estado = String(t.ESTADO || t.estado || 'Pendiente').toLowerCase();
                                const prioridad = String(t.PRIORIDAD || t.prioridad || 'Media');
                                const checklist = getTaskChecklist(t);
                                const completedCount = checklist.filter(c => c.completed).length;
                                const progressPct = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

                                let statusBg = 'bg-amber-100 text-amber-800 border-amber-200';
                                if (estado === 'en proceso') statusBg = 'bg-blue-100 text-blue-800 border-blue-200';
                                else if (estado === 'completada') statusBg = 'bg-emerald-100 text-emerald-800 border-emerald-200';

                                let prioBg = 'bg-slate-100 text-slate-700';
                                if (prioridad.toLowerCase() === 'alta') prioBg = 'bg-rose-100 text-rose-700 font-black';
                                else if (prioridad.toLowerCase() === 'media') prioBg = 'bg-amber-100 text-amber-700 font-bold';

                                return (
                                    <div
                                        key={t.ID_TAREA || t.id_tarea || idx}
                                        className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between space-y-4 relative group"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusBg}`}>
                                                    {t.ESTADO || t.estado || 'Pendiente'}
                                                </span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${prioBg}`}>
                                                    Prioridad {prioridad}
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="text-base font-black text-slate-900 group-hover:text-[#2C4C8C] transition-colors leading-snug">
                                                    {t.CLIENTE_NOMBRE || t.cliente_nombre || 'Aliado Comercial'}
                                                </h3>
                                                <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                                                    <Icon name="MapPin" size={14} className="shrink-0 text-slate-400 mt-0.5" />
                                                    <span>{t.DIRECCION || t.direccion || 'Dirección no especificada'}</span>
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                <div className="flex items-center gap-1.5">
                                                    <Icon name="Calendar" size={14} className="text-indigo-600" />
                                                    <span>{t.FECHA_PROGRAMADA || t.fecha_programada}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Icon name="Clock" size={14} className="text-indigo-600" />
                                                    <span>{t.HORA_PROGRAMADA || t.hora_programada || '09:00'}</span>
                                                </div>
                                            </div>

                                            {t.DESCRIPCION || t.descripcion ? (
                                                <p className="text-xs text-slate-600 line-clamp-2 italic bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                                                    "{t.DESCRIPCION || t.descripcion}"
                                                </p>
                                            ) : null}

                                            {checklist.length > 0 && (
                                                <div className="space-y-1.5 pt-1">
                                                    <div className="flex justify-between text-[11px] font-bold text-slate-500">
                                                        <span>Checklist ({completedCount}/{checklist.length})</span>
                                                        <span>{progressPct}%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-600 transition-all" style={{ width: `${progressPct}%` }}></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                            <span className="text-[10px] font-mono text-slate-400">{t.ID_TAREA || t.id_tarea}</span>
                                            <button
                                                onClick={() => {
                                                    setSelectedTask(t);
                                                    setDetailTab('detalles');
                                                }}
                                                className="px-4 py-2 bg-slate-900 hover:bg-[#2C4C8C] text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                                            >
                                                <span>Gestionar Visita</span>
                                                <Icon name="ChevronRight" size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        )}
                        {viewMode !== 'list' && (
                            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm overflow-x-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black text-slate-800 capitalize">
                                        {calendarDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                                    </h3>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => {
                                                const d = new Date(calendarDate);
                                                if (viewMode === 'calendar_week') d.setDate(d.getDate() - 7);
                                                else d.setMonth(d.getMonth() - 1);
                                                setCalendarDate(d);
                                            }}
                                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-bold text-xs flex items-center"
                                        >
                                            <Icon name="ChevronLeft" size={14} /> Anterior
                                        </button>
                                        <button 
                                            onClick={() => setCalendarDate(new Date())}
                                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-xs"
                                        >
                                            Hoy
                                        </button>
                                        <button 
                                            onClick={() => {
                                                const d = new Date(calendarDate);
                                                if (viewMode === 'calendar_week') d.setDate(d.getDate() + 7);
                                                else d.setMonth(d.getMonth() + 1);
                                                setCalendarDate(d);
                                            }}
                                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-bold text-xs flex items-center"
                                        >
                                            Siguiente <Icon name="ChevronRight" size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="min-w-[700px]">
                                    <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                                            <div key={d} className="bg-slate-50 py-2 text-center text-xs font-black text-slate-500 uppercase tracking-widest">
                                                {d}
                                            </div>
                                        ))}
                                        
                                        {(() => {
                                            const y = calendarDate.getFullYear();
                                            const m = calendarDate.getMonth();
                                            const daysInMonth = getDaysInMonth(y, m);
                                            const firstDay = getFirstDayOfMonth(y, m);
                                            
                                            // Handle week view
                                            let startRender = 1;
                                            let endRender = daysInMonth;
                                            let prefixBlanks = firstDay;
                                            let suffixBlanks = (7 - ((firstDay + daysInMonth) % 7)) % 7;
                                            
                                            if (viewMode === 'calendar_week') {
                                                const currDayOfMonth = calendarDate.getDate();
                                                const currDayOfWeek = calendarDate.getDay();
                                                const weekStartDay = currDayOfMonth - currDayOfWeek;
                                                
                                                // Simplified week logic: just render 7 cells for the current week window
                                                const cells = [];
                                                for (let i = 0; i < 7; i++) {
                                                    const d = new Date(y, m, weekStartDay + i);
                                                    const dStr = d.toISOString().split('T')[0];
                                                    const dTasks = myTasks.filter(t => (t.FECHA_PROGRAMADA || t.fecha_programada || '').startsWith(dStr));
                                                    
                                                    const isToday = dStr === new Date().toISOString().split('T')[0];
                                                    
                                                    cells.push(
                                                        <div key={i} className={`min-h-[120px] bg-white p-2 border-t border-slate-100 transition-colors hover:bg-slate-50 ${isToday ? 'bg-indigo-50/30' : ''}`}>
                                                            <div className={`text-xs font-bold mb-2 flex justify-between items-center ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                                <span className={`w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : ''}`}>{d.getDate()}</span>
                                                                {dTasks.length > 0 && <span className="bg-slate-100 text-slate-500 px-1.5 rounded text-[10px]">{dTasks.length}</span>}
                                                            </div>
                                                            <div className="space-y-1">
                                                                {dTasks.map(t => {
                                                                    const estado = String(t.ESTADO || t.estado || 'Pendiente').toLowerCase();
                                                                    let dotBg = 'bg-amber-400';
                                                                    if (estado === 'en proceso') dotBg = 'bg-blue-400';
                                                                    else if (estado === 'completada') dotBg = 'bg-emerald-400';
                                                                    
                                                                    return (
                                                                        <div 
                                                                            key={t.ID_TAREA || t.id_tarea}
                                                                            onClick={() => { setSelectedTask(t); setDetailTab('detalles'); }}
                                                                            className="text-[10px] font-bold text-slate-700 bg-slate-100 rounded px-1.5 py-1 truncate cursor-pointer hover:bg-indigo-100 hover:text-indigo-800 border border-slate-200/50 flex items-center gap-1.5"
                                                                            title={t.CLIENTE_NOMBRE || t.cliente_nombre}
                                                                        >
                                                                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotBg}`}></div>
                                                                            <span className="truncate">{t.CLIENTE_NOMBRE || t.cliente_nombre}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return cells;
                                            } else {
                                                // Month view
                                                const cells = [];
                                                for (let i = 0; i < prefixBlanks; i++) {
                                                    cells.push(<div key={`blank-start-${i}`} className="bg-slate-50/50 min-h-[100px] border-t border-slate-100"></div>);
                                                }
                                                for (let i = 1; i <= daysInMonth; i++) {
                                                    const dStr = `${y}-${String(m+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
                                                    const dTasks = myTasks.filter(t => (t.FECHA_PROGRAMADA || t.fecha_programada || '').startsWith(dStr));
                                                    const isToday = dStr === new Date().toISOString().split('T')[0];
                                                    
                                                    cells.push(
                                                        <div key={`day-${i}`} className={`min-h-[100px] bg-white p-2 border-t border-slate-100 hover:bg-slate-50 transition-colors ${isToday ? 'bg-indigo-50/30' : ''}`}>
                                                            <div className={`text-xs font-bold mb-1.5 flex justify-between items-center ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                                <span className={`w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : ''}`}>{i}</span>
                                                                {dTasks.length > 0 && <span className="bg-slate-100 text-slate-500 px-1.5 rounded text-[10px]">{dTasks.length}</span>}
                                                            </div>
                                                            <div className="space-y-1">
                                                                {dTasks.slice(0,3).map(t => {
                                                                    const estado = String(t.ESTADO || t.estado || 'Pendiente').toLowerCase();
                                                                    let dotBg = 'bg-amber-400';
                                                                    if (estado === 'en proceso') dotBg = 'bg-blue-400';
                                                                    else if (estado === 'completada') dotBg = 'bg-emerald-400';
                                                                    return (
                                                                        <div 
                                                                            key={t.ID_TAREA || t.id_tarea}
                                                                            onClick={() => { setSelectedTask(t); setDetailTab('detalles'); }}
                                                                            className="text-[10px] font-bold text-slate-700 bg-slate-100 rounded px-1.5 py-1 truncate cursor-pointer hover:bg-indigo-100 hover:text-indigo-800 border border-slate-200/50 flex items-center gap-1.5"
                                                                        >
                                                                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotBg}`}></div>
                                                                            <span className="truncate">{t.CLIENTE_NOMBRE || t.cliente_nombre}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                                {dTasks.length > 3 && (
                                                                    <div className="text-[9px] font-black text-slate-400 text-center uppercase tracking-widest pt-1">
                                                                        +{dTasks.length - 3} más
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                for (let i = 0; i < suffixBlanks; i++) {
                                                    cells.push(<div key={`blank-end-${i}`} className="bg-slate-50/50 min-h-[100px] border-t border-slate-100"></div>);
                                                }
                                                return cells;
                                            }
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}
                        </React.Fragment>
                    )}

                    {showNewTaskModal && (
                        <div className="fixed inset-0 z-[7000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                            <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-200">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                                            <Icon name="Calendar" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900">Programar Nueva Tarea / Visita</h3>
                                            <p className="text-xs text-slate-500">Asigna cliente, prioridad e ítems de verificación.</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowNewTaskModal(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100">
                                        <Icon name="X" size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleCreateTask} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Cliente / Aliado Comercial *</label>
                                        <select
                                            required
                                            value={newTask.id_cliente}
                                            onChange={e => handleSelectClienteInNewTask(e.target.value)}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="">-- Selecciona Aliado Comercial --</option>
                                            {availableClientes.map((c, i) => (
                                                <option key={`${c.id_cliente || c.ID_CLIENTE}-${i}`} value={c.id_cliente || c.ID_CLIENTE}>
                                                    {c.nombre_cliente || c.NOMBRE_CLIENTE} ({c.un || c.UN || 'UN'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Dirección de la Tienda *</label>
                                        <input
                                            type="text"
                                            required
                                            value={newTask.direccion}
                                            onChange={e => setNewTask({ ...newTask, direccion: e.target.value })}
                                            placeholder="Dirección o punto de encuentro"
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Fecha Programada *</label>
                                            <input
                                                type="date"
                                                required
                                                value={newTask.fecha_programada}
                                                onChange={e => setNewTask({ ...newTask, fecha_programada: e.target.value })}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Hora Estimada</label>
                                            <input
                                                type="time"
                                                value={newTask.hora_programada}
                                                onChange={e => setNewTask({ ...newTask, hora_programada: e.target.value })}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Prioridad</label>
                                            <select
                                                value={newTask.prioridad}
                                                onChange={e => setNewTask({ ...newTask, prioridad: e.target.value })}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="Alta">Alta</option>
                                                <option value="Media">Media</option>
                                                <option value="Baja">Baja</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Descripción / Objetivo de la Visita</label>
                                        <textarea
                                            rows="2"
                                            value={newTask.descripcion}
                                            onChange={e => setNewTask({ ...newTask, descripcion: e.target.value })}
                                            placeholder="Detalla los objetivos principales de la gestión comercial..."
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div className="pt-2 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowNewTaskModal(false)}
                                            className="px-5 py-2.5 text-slate-600 font-bold text-xs uppercase hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2.5 bg-[#2C4C8C] hover:bg-indigo-900 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                                        >
                                            Guardar y Asignar Tarea
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {selectedTask && (
                        <div className="fixed inset-0 z-[7000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
                                <div className="bg-slate-900 p-6 text-white shrink-0 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                                                {selectedTask.ID_TAREA || selectedTask.id_tarea}
                                            </span>
                                            <span className="text-xs text-slate-400 font-medium">
                                                {selectedTask.FECHA_PROGRAMADA || selectedTask.fecha_programada} @ {selectedTask.HORA_PROGRAMADA || selectedTask.hora_programada || '09:00'}
                                            </span>
                                        </div>
                                        <h2 className="text-xl font-black tracking-tight text-white">
                                            {selectedTask.CLIENTE_NOMBRE || selectedTask.cliente_nombre || 'Aliado Comercial'}
                                        </h2>
                                        <p className="text-xs text-slate-300 mt-1 flex items-center gap-1">
                                            <Icon name="MapPin" size={14} className="text-emerald-400" />
                                            <span>{selectedTask.DIRECCION || selectedTask.direccion}</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedTask(null)}
                                        className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                                    >
                                        <Icon name="X" size={20} />
                                    </button>
                                </div>

                                <div className="bg-slate-100 border-b border-slate-200 px-6 pt-3 flex gap-2 overflow-x-auto shrink-0">
                                    <button
                                        onClick={() => setDetailTab('detalles')}
                                        className={`px-4 py-2.5 rounded-t-2xl font-black text-xs uppercase tracking-wider transition-all border-t border-x cursor-pointer ${detailTab === 'detalles' ? 'bg-white text-[#2C4C8C] border-slate-200 border-b-transparent shadow-sm' : 'text-slate-500 hover:text-slate-800 border-transparent'}`}
                                    >
                                        <Icon name="FileText" size={14} className="inline mr-1.5" /> Detalles
                                    </button>
                                    <button
                                        onClick={() => setDetailTab('checklist')}
                                        className={`px-4 py-2.5 rounded-t-2xl font-black text-xs uppercase tracking-wider transition-all border-t border-x cursor-pointer ${detailTab === 'checklist' ? 'bg-white text-[#2C4C8C] border-slate-200 border-b-transparent shadow-sm' : 'text-slate-500 hover:text-slate-800 border-transparent'}`}
                                    >
                                        <Icon name="CheckSquare" size={14} className="inline mr-1.5" /> Checklist
                                    </button>
                                    <button
                                        onClick={() => setDetailTab('evidencia')}
                                        className={`px-4 py-2.5 rounded-t-2xl font-black text-xs uppercase tracking-wider transition-all border-t border-x cursor-pointer ${detailTab === 'evidencia' ? 'bg-white text-[#2C4C8C] border-slate-200 border-b-transparent shadow-sm' : 'text-slate-500 hover:text-slate-800 border-transparent'}`}
                                    >
                                        <Icon name="Camera" size={14} className="inline mr-1.5" /> Evidencia (GPS)
                                    </button>
                                    <button
                                        onClick={() => setDetailTab('monitoreo')}
                                        className={`px-4 py-2.5 rounded-t-2xl font-black text-xs uppercase tracking-wider transition-all border-t border-x cursor-pointer ${detailTab === 'monitoreo' ? 'bg-white text-[#2C4C8C] border-slate-200 border-b-transparent shadow-sm' : 'text-slate-500 hover:text-slate-800 border-transparent'}`}
                                    >
                                        <Icon name="Clock" size={14} className="inline mr-1.5" /> Monitoreo (Check-in/out)
                                    </button>
                                </div>

                                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                                    {detailTab === 'detalles' && (
                                        <div className="space-y-6 animate-in fade-in">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Estado de la Tarea</span>
                                                    <span className="text-sm font-black text-slate-800 uppercase">{selectedTask.ESTADO || selectedTask.estado || 'Pendiente'}</span>
                                                </div>
                                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Prioridad</span>
                                                    <span className="text-sm font-black text-slate-800 uppercase">{selectedTask.PRIORIDAD || selectedTask.prioridad || 'Media'}</span>
                                                </div>
                                            </div>

                                            <div className="bg-indigo-50/60 p-5 rounded-2xl border border-indigo-100 space-y-3">
                                                <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                                                    <Icon name="Navigation" size={16} /> Ubicación y Dirección
                                                </h4>
                                                <p className="text-sm text-indigo-950 font-bold">{selectedTask.DIRECCION || selectedTask.direccion}</p>
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedTask.DIRECCION || selectedTask.direccion || selectedTask.CLIENTE_NOMBRE)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black tracking-wider transition-colors shadow-sm"
                                                >
                                                    <Icon name="Navigation" size={14} /> Abrir Navegación en Google Maps
                                                </a>
                                            </div>

                                            <div>
                                                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Descripción / Instrucciones del Comercial</h4>
                                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-slate-700 text-sm leading-relaxed">
                                                    {selectedTask.DESCRIPCION || selectedTask.descripcion || 'Sin descripción adicional dada por la administración.'}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {detailTab === 'checklist' && (
                                        <div className="space-y-6 animate-in fade-in">
                                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-800">Lista de Verificación de la Visita</h4>
                                                    <p className="text-xs text-slate-500">Marca las actividades realizadas durante la atención comercial.</p>
                                                </div>
                                                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-black rounded-full">
                                                    {getTaskChecklist(selectedTask).filter(c => c.completed).length} / {getTaskChecklist(selectedTask).length}
                                                </span>
                                            </div>

                                            <div className="space-y-2">
                                                {getTaskChecklist(selectedTask).map((item, idx) => (
                                                    <div
                                                        key={item.id || idx}
                                                        onClick={() => handleToggleChecklistItem(idx)}
                                                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${item.completed ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${item.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'}`}>
                                                                {item.completed && <Icon name="CheckCircle" size={16} />}
                                                            </div>
                                                            <span className={`text-xs font-bold ${item.completed ? 'line-through opacity-80' : 'text-slate-800'}`}>{item.text}</span>
                                                        </div>
                                                        <span className="text-[10px] uppercase font-black tracking-wider opacity-60">{item.completed ? 'Completado' : 'Pendiente'}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex gap-2 pt-2">
                                                <input
                                                    type="text"
                                                    value={newChecklistText}
                                                    onChange={e => setNewChecklistText(e.target.value)}
                                                    placeholder="Agregar nuevo ítem de verificación..."
                                                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <button
                                                    onClick={handleAddChecklistItem}
                                                    className="px-4 py-2 bg-slate-900 hover:bg-indigo-900 text-white font-bold text-xs uppercase rounded-xl transition-colors shrink-0 cursor-pointer"
                                                >
                                                    + Agregar
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {detailTab === 'evidencia' && (
                                        <div className="space-y-6 animate-in fade-in">
                                            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                                        <Icon name="MapPin" size={16} /> GPS Automático (No Modificable)
                                                    </span>
                                                    <button
                                                        onClick={captureGPS}
                                                        disabled={geoLoc.loading}
                                                        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <Icon name="RefreshCw" size={12} className={geoLoc.loading ? 'animate-spin' : ''} /> Actualizar Coordenadas
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Latitud</label>
                                                        <input
                                                            type="text"
                                                            readOnly={true}
                                                            value={geoLoc.lat || (geoLoc.loading ? 'Consultando GPS...' : 'Sin GPS')}
                                                            className="w-full px-3 py-2 bg-white/10 text-emerald-300 font-mono font-bold text-xs rounded-xl border border-white/10 cursor-not-allowed"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Longitud</label>
                                                        <input
                                                            type="text"
                                                            readOnly={true}
                                                            value={geoLoc.lon || (geoLoc.loading ? 'Consultando GPS...' : 'Sin GPS')}
                                                            className="w-full px-3 py-2 bg-white/10 text-emerald-300 font-mono font-bold text-xs rounded-xl border border-white/10 cursor-not-allowed"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Precisión GPS</label>
                                                        <input
                                                            type="text"
                                                            readOnly={true}
                                                            value={geoLoc.accuracy ? `± ${geoLoc.accuracy} m` : 'N/A'}
                                                            className="w-full px-3 py-2 bg-white/10 text-indigo-200 font-mono font-bold text-xs rounded-xl border border-white/10 cursor-not-allowed"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Subir Nueva Fotografía de Evidencia</h4>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Categoría de Evidencia</label>
                                                        <select
                                                            value={evidenceType}
                                                            onChange={e => setEvidenceType(e.target.value)}
                                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                                                        >
                                                            <option value="Fachada de Tienda">Fachada de Tienda</option>
                                                            <option value="Material POP">Material POP</option>
                                                            <option value="Inventario de Equipos">Inventario de Equipos</option>
                                                            <option value="Soporte de Pago/Recaudo">Soporte de Pago / Recaudo</option>
                                                            <option value="Acta de Visita">Acta de Visita / Firma</option>
                                                            <option value="Otros">Otros</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Seleccionar o Tomar Foto</label>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            capture="environment"
                                                            onChange={handleImageUpload}
                                                            className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                                                        />
                                                    </div>
                                                </div>

                                                {evidenceImg && (
                                                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-h-56 bg-black flex items-center justify-center">
                                                        <img src={evidenceImg} alt="Preview Evidencia" className="max-h-56 object-contain" />
                                                        <button
                                                            onClick={() => setEvidenceImg('')}
                                                            className="absolute top-2 right-2 bg-rose-600 text-white p-1.5 rounded-full shadow-md hover:bg-rose-700 cursor-pointer"
                                                        >
                                                            <Icon name="X" size={16} />
                                                        </button>
                                                    </div>
                                                )}

                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Notas / Observaciones de la Foto</label>
                                                    <input
                                                        type="text"
                                                        value={evidenceNotes}
                                                        onChange={e => setEvidenceNotes(e.target.value)}
                                                        placeholder="Ej. Exhibición principal con 10 afiches colocados..."
                                                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                                                    />
                                                </div>

                                                <button
                                                    onClick={handleSaveEvidencia}
                                                    disabled={submittingEvidencia || !geoLoc.lat || !evidenceImg}
                                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                                                >
                                                    <Icon name="Save" size={16} />
                                                    <span>{submittingEvidencia ? 'Guardando en BD (trop_fotos_gps)...' : 'Guardar Evidencia con GPS Obligatorio'}</span>
                                                </button>
                                            </div>

                                            {evidencesForSelected.length > 0 && (
                                                <div className="space-y-3 pt-2">
                                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Evidencias Registradas ({evidencesForSelected.length})</h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                                        {evidencesForSelected.map((ev, i) => (
                                                            <div key={ev.ID_EVIDENCIA || i} className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2 shadow-sm">
                                                                <div className="h-40 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                                                                    <img src={ev.IMAGEN_URL_O_BASE64 || ev.imagen_url_o_base64} alt="Evidencia" className="h-full object-cover w-full" />
                                                                </div>
                                                                <div className="space-y-1 text-xs">
                                                                    <div className="flex justify-between font-bold text-slate-800">
                                                                        <span>{ev.TIPO_EVIDENCIA || ev.tipo_evidencia}</span>
                                                                        <span className="text-[10px] text-slate-400">{ev.FECHA_CAPTURA || ev.fecha_captura}</span>
                                                                    </div>
                                                                    <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                                                                        <Icon name="MapPin" size={12} className="text-emerald-600" />
                                                                        <span>{ev.LATITUD || ev.latitud}, {ev.LONGITUD || ev.longitud}</span>
                                                                    </p>
                                                                    {ev.NOTAS || ev.notas ? <p className="text-[11px] text-slate-600 italic">"{ev.NOTAS || ev.notas}"</p> : null}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {detailTab === 'monitoreo' && (
                                        <div className="space-y-6 animate-in fade-in">
                                            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                                        <Icon name="MapPin" size={16} /> Control de Tiempos y GPS
                                                    </span>
                                                    <button onClick={captureGPS} className="text-[10px] font-bold text-indigo-300 underline cursor-pointer">
                                                        Refrescar GPS
                                                    </button>
                                                </div>
                                                <p className="text-xs text-slate-300">
                                                    Coordenadas actuales: <strong className="font-mono text-white">{geoLoc.lat || 'Sin GPS'}, {geoLoc.lon || ''}</strong> (Precisión: {geoLoc.accuracy ? `${geoLoc.accuracy} m` : 'N/A'})
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                                <button
                                                    onClick={handleCheckIn}
                                                    disabled={submittingAction || !geoLoc.lat}
                                                    className="p-6 bg-gradient-to-br from-emerald-500 to-teal-700 hover:from-emerald-600 hover:to-teal-800 disabled:opacity-50 text-white rounded-2xl shadow-lg transition-all text-left space-y-2 group cursor-pointer"
                                                >
                                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                                        <Icon name="Play" size={20} />
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-black uppercase tracking-wider block opacity-90">Paso 1</span>
                                                        <h4 className="text-lg font-black">Registrar Check-in</h4>
                                                        <p className="text-xs opacity-80 mt-1">Marca el inicio de la atención en tienda.</p>
                                                    </div>
                                                </button>

                                                <button
                                                    onClick={handleCheckOut}
                                                    disabled={submittingAction || !geoLoc.lat}
                                                    className="p-6 bg-gradient-to-br from-indigo-600 to-slate-900 hover:from-indigo-700 hover:to-slate-950 disabled:opacity-50 text-white rounded-2xl shadow-lg transition-all text-left space-y-2 group cursor-pointer"
                                                >
                                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                                        <Icon name="Square" size={20} />
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-black uppercase tracking-wider block opacity-90">Paso 2</span>
                                                        <h4 className="text-lg font-black">Registrar Check-out</h4>
                                                        <p className="text-xs opacity-80 mt-1">Calcula la duración total de la visita.</p>
                                                    </div>
                                                </button>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Observaciones de la Gestión</label>
                                                <textarea
                                                    rows="3"
                                                    value={checkinObs}
                                                    onChange={e => setCheckinObs(e.target.value)}
                                                    placeholder="Anota acuerdos con el aliado, compromisos o detalles..."
                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>

                                            {activeVisitForSelected && (
                                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Historial de Monitoreo de esta Visita</h4>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                                        <div className="bg-white p-3 rounded-xl border border-slate-100">
                                                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Check-in</span>
                                                            <span className="font-bold text-slate-800">{activeVisitForSelected.CHECKIN_FECHA || activeVisitForSelected.checkin_fecha || 'Pendiente'}</span>
                                                        </div>
                                                        <div className="bg-white p-3 rounded-xl border border-slate-100">
                                                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Check-out</span>
                                                            <span className="font-bold text-slate-800">{activeVisitForSelected.CHECKOUT_FECHA || activeVisitForSelected.checkout_fecha || 'En proceso...'}</span>
                                                        </div>
                                                        <div className="bg-white p-3 rounded-xl border border-slate-100">
                                                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Duración</span>
                                                            <span className="font-bold text-indigo-600">{activeVisitForSelected.DURACION_MINUTOS || activeVisitForSelected.duracion_minutos || 0} min</span>
                                                        </div>
                                                        <div className="bg-white p-3 rounded-xl border border-slate-100">
                                                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Retraso Detectado</span>
                                                            <span className="font-bold text-amber-600">{activeVisitForSelected.RETRASO_MINUTOS || activeVisitForSelected.retraso_minutos || 0} min</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        };

        