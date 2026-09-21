const fs = require('fs');
let content = fs.readFileSync('src/main.jsx', 'utf8');

const target = `                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        };

        const AdminView`;

const replacement = `                                </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        };

        const AdminView`;

content = content.replace(target, replacement);
fs.writeFileSync('src/main.jsx', content);
