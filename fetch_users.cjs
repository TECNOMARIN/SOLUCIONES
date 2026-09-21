const fs = require('fs');
const https = require('https');

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzH2a6_gdBJ6uEzmms8qneHg5XnpThtWALqEjgZ9YYcEyMdG1ikYWb68POhtVELJdrdRA/exec?action=getData";

https.get(SCRIPT_URL, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            // It might be a redirect (Apps script usually redirects to echousercontent)
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                console.log("Redirecting to:", res.headers.location);
                https.get(res.headers.location, (res2) => {
                    let data2 = '';
                    res2.on('data', (chunk) => data2 += chunk);
                    res2.on('end', () => {
                        const parsed = JSON.parse(data2);
                        const usersData = {
                            clientes: parsed.data.clientes,
                            config_permisos: parsed.data.config_permisos
                        };
                        fs.writeFileSync('public/users.json', JSON.stringify(usersData, null, 2));
                        console.log("Saved users.json");
                    });
                });
            } else {
                const parsed = JSON.parse(data);
                const usersData = {
                    clientes: parsed.data.clientes,
                    config_permisos: parsed.data.config_permisos
                };
                fs.writeFileSync('public/users.json', JSON.stringify(usersData, null, 2));
                console.log("Saved users.json");
            }
        } catch (e) {
            console.error("Error:", e.message);
        }
    });
}).on("error", (err) => {
    console.error("Error: " + err.message);
});
