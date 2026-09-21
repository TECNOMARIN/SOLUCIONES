const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const headEnd = `</head>`;
const headAdditions = `    <!-- PWA Requirements -->
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#1e3a6d">
    <link rel="apple-touch-icon" href="/soluciones_logo.png">
</head>`;

html = html.replace(headEnd, headAdditions);

const bodyEnd = `</body>`;
const bodyAdditions = `    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(registration => {
                    console.log('SW registered: ', registration);
                }).catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
            });
        }
    </script>
</body>`;

html = html.replace(bodyEnd, bodyAdditions);

fs.writeFileSync('index.html', html);
