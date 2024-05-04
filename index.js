const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3001;

// Parse JSON bodies
app.use(bodyParser.json());

// Handle POST requests to '/post'
app.post('/post', (req, res) => {
  // Access the POST data sent in the request body
  const postData = req.body;

  // Process the received data
  console.log('Received data:', postData);

  // Respond with a simple message
  res.send('Received your POST request!');
});

app.get('/get', (req, res) => {
  // Respond with a simple message
  console.log('Received GET request');
  res.status(200).send({ message: 'Hello World!' });
})

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
