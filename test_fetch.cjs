const url = "https://script.google.com/macros/s/AKfycbzH2a6_gdBJ6uEzmms8qneHg5XnpThtWALqEjgZ9YYcEyMdG1ikYWb68POhtVELJdrdRA/exec?action=getData";
fetch(url)
  .then(res => res.text())
  .then(text => console.log(text.substring(0, 100)))
  .catch(err => console.error(err));
