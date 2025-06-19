const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Schema
const exerciseSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: Date
});

const userSchema = new mongoose.Schema({
  username: String,
  log: [exerciseSchema]
});

const User = mongoose.model('User', userSchema);

// Create user
app.post('/api/users', async (req, res) => {
  const user = new User({ username: req.body.username });
  await user.save();
  res.json({ username: user.username, _id: user._id });
});

// Get all users
app.get('/api/users', async (req, res) => {
  const users = await User.find({}, 'username _id');
  res.json(users);
});

// Add exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { description, duration, date } = req.body;
  const user = await User.findById(req.params._id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const exerciseDate = date ? new Date(date) : new Date();

  const exercise = {
    description,
    duration: parseInt(duration),
    date: exerciseDate
  };

  user.log.push(exercise);
  await user.save();

  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString(),
    _id: user._id
  });
});

// Get logs
app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  const user = await User.findById(req.params._id);

  if (!user) return res.status(404).json({ error: 'User not found' });

  let log = [...user.log];

  if (from) {
    const fromDate = new Date(from);
    log = log.filter(ex => ex.date >= fromDate);
  }

  if (to) {
    const toDate = new Date(to);
    log = log.filter(ex => ex.date <= toDate);
  }

  if (limit) {
    log = log.slice(0, parseInt(limit));
  }

  const formattedLog = log.map(ex => ({
    description: ex.description,
    duration: ex.duration,
    date: ex.date.toDateString()
  }));

  res.json({
    username: user.username,
    count: formattedLog.length,
    _id: user._id,
    log: formattedLog
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
