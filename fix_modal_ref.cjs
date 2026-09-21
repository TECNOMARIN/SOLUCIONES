const fs = require('fs');
let content = fs.readFileSync('src/main.jsx', 'utf8');

const targetToRemove = `{showConfigColumnasModal && portfolio && (
                        <ConfigColumnasModal 
                            portfolio={portfolio} 
                            onClose={() => setShowConfigColumnasModal(false)} 
                            db={props.db}
                            showToast={props.showToast}
                        />
                    )}`;

content = content.replace(targetToRemove, '');
fs.writeFileSync('src/main.jsx', content);
