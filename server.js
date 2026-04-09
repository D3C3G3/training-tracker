const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Sirve archivos estáticos desde el directorio actual
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'training-tracker.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
