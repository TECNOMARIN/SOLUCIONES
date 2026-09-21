const fs = require('fs');

const mainContent = fs.readFileSync('src/main.jsx', 'utf8');
const newAgenda = fs.readFileSync('agenda_extracted.jsx', 'utf8');

const startMarker = "const AgendaVisitasView = ({ db, currentUser, userPerms, apiCall, showToast, setActiveView }) => {";
const endMarker = "const SecurityView = ({ db, setDb, apiCall, showToast, userPerms }) => {";

const startIndex = mainContent.indexOf(startMarker);
const endIndex = mainContent.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const before = mainContent.substring(0, startIndex);
    const after = mainContent.substring(endIndex);
    
    fs.writeFileSync('src/main.jsx', before + newAgenda + after);
    console.log("Successfully reinjected Agenda into src/main.jsx");
} else {
    console.log("Could not find markers for reinjection");
}
