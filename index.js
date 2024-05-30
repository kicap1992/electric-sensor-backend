const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const socket = require('./socket');
const app = express();
const server = http.createServer(app);
const io = socket.init(server);
const iosend = socket.getIO();
const conn = require('./conn.js');
const connection = conn.connection;

dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(fileUpload());
app.options('*', cors());
app.use(cors());

function timeStringToDate(timeStr) {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, seconds, 0);
  return date;
}

// Handle POST requests to '/post'
app.post('/', async (req, res) => {
  // Access the POST data sent in the request body
  var postData = req.body;

  const query_search = 'Select * from tb_data where fase=?';

  const result_search = await new Promise((resolve, reject) => {
    connection.query(query_search, [postData.fase], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  })
  var now = new Date();
  var hours = now.getHours();
  var minutes = now.getMinutes();
  var seconds = now.getSeconds();

  // Pad single digits with leading zeros
  hours = hours < 10 ? '0' + hours : hours;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  seconds = seconds < 10 ? '0' + seconds : seconds;
  // change the time to 24 h format with no AM/PM . example 12:00:01, li
  time = hours + ':' + minutes + ':' + seconds;
  // if time only 12:00 add :00

  // console.log(result_search);
  if (result_search.length > 0) {
    // get the last data
    const data_seach = result_search[result_search.length - 1];
    const time_last = data_seach.time;
    console.log("ini current time: " + time)
    // console.log("ini last time: " + time_last)
    const converted_time_last = timeStringToDate(time_last);
    const converted_time = timeStringToDate(time);
    console.log('Converted time:', converted_time);
    console.log('Converted time last:', converted_time_last);

    // Calculate the difference in seconds
    const differenceInSeconds = (converted_time - converted_time_last) / 1000;

    console.log('Difference in seconds:', differenceInSeconds);

    // Check if the difference is exactly 30 seconds
    // const isThirtySecondsApart = differenceInSeconds === 30;


    // check if time_last is 30 second ago from time
    // if (differenceInSeconds < 10800) {
    if (differenceInSeconds < 3600) {
      console.log('data is not new');
      postData.time = time;
      console.log('Received data:', postData);
      iosend.emit('datanya', postData);


      // Respond with a simple message
      res.send('Received your POST request!');
      return;
    }
    const query_insert = 'INSERT INTO tb_data (fase, voltage, current, power, energy, pf, time) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const result_insert = await new Promise((resolve, reject) => {
      connection.query(query_insert, [postData.fase, postData.voltage, postData.current, postData.power, postData.energy, postData.pf, time], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    })
  } else {
    const query_insert = 'INSERT INTO tb_data (fase, voltage, current, power, energy, pf, time) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const result_insert = await new Promise((resolve, reject) => {
      connection.query(query_insert, [postData.fase, postData.voltage, postData.current, postData.power, postData.energy, postData.pf, time], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    })
  }
  // Process the received data

  // get timge by hh:mm





  postData.time = time;
  console.log('Received data:', postData);
  iosend.emit('datanya', postData);


  // Respond with a simple message
  res.send('Received your POST request!');
});

app.get('/', async (req, res) => {
  // only show 10 last data
  const query_fase_r = 'Select * from tb_data where fase="Fase R" order by id desc limit 10';
  const query_fase_s = 'Select * from tb_data where fase="Fase S" order by id desc limit 10';
  const query_fase_t = 'Select * from tb_data where fase="Fase T" order by id desc limit 10';

  const result_fase_r = await new Promise((resolve, reject) => {
    connection.query(query_fase_r, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  })
  const result_fase_s = await new Promise((resolve, reject) => {
    connection.query(query_fase_s, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  })
  const result_fase_t =await  new Promise((resolve, reject) => {
    connection.query(query_fase_t, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    })
  })

  return res.json({ "result_fase_r": result_fase_r, "result_fase_s": result_fase_s, "result_fase_t": result_fase_t });

})

// app error handler
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send('Something broke!');
});

io.on('connection', (socket) => {
  let userID = socket.id;
  console.log('A user connected: ' + userID);

  socket.on('scan_dia', (data) => {
    console.log('Received scan_dia event: ' + data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected: ' + userID);
  });
});

module.exports = {
  app,
  server,
  io
};

const port = process.env.PORT || 3001;

// Start the server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
