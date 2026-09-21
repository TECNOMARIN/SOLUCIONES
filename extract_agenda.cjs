const fs = require('fs');
const content = fs.readFileSync('src/main.jsx', 'utf8');

const startMarker = "const AgendaVisitasView = ({ db, currentUser, userPerms, apiCall, showToast, setActiveView }) => {";
const endMarker = "const SecurityView = ({ db, setDb, apiCall, showToast, userPerms }) => {";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const extracted = content.substring(startIndex, endIndex);
  fs.writeFileSync('agenda_extracted.jsx', extracted);
  console.log("Extracted to agenda_extracted.jsx");
} else {
  console.log("Could not find markers.", startIndex, endIndex);
}
