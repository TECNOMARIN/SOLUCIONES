const fs = require('fs');
let content = fs.readFileSync('src/main.jsx', 'utf8');

const oldQr = `                                </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        };`;

const newQr = `                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        };`;

content = content.replace(oldQr, newQr);
fs.writeFileSync('src/main.jsx', content);
