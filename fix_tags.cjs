const fs = require('fs');
let content = fs.readFileSync('src/main.jsx', 'utf8');

// Fix the incorrect replacement at the end of the file
content = content.replace("                                </>)}\n                            </div>\n                        </div>", "                                </div>\n                            </div>\n                        </div>");

// Now inject `</>)}` at the right place
const correctTarget = `                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MODAL DE AGREGAR CRÉDITO MANUAL */}`;
                    
const correctReplacement = `                                    )}
                                </div>
                                </>)}
                            </div>
                        </div>
                    )}

                    {/* MODAL DE AGREGAR CRÉDITO MANUAL */}`;

content = content.replace(correctTarget, correctReplacement);

fs.writeFileSync('src/main.jsx', content);
