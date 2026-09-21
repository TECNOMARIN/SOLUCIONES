const fs = require('fs');
let content = fs.readFileSync('src/main.jsx', 'utf8');

// I will remove the extra </div> in qrModal directly:
const badQr = `<div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm inline-block">
                                        <img src={\`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=\${encodeURIComponent(qrModal.url)}\`} alt="QR Code" className="w-52 h-52" />
                                    </div>
                                </div>
                                </div>
                            </div>
                        </div>`;
const goodQr = `<div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm inline-block">
                                        <img src={\`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=\${encodeURIComponent(qrModal.url)}\`} alt="QR Code" className="w-52 h-52" />
                                    </div>
                                </div>
                            </div>
                        </div>`;
content = content.replace(badQr, goodQr);
fs.writeFileSync('src/main.jsx', content);
