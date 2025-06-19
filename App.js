// ✅ Exercise Tracker - Full Working Code (server.js)

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// ✅ MongoDB Setup
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.once('open', () => {
    console.log('✅ Connected to MongoDB');
  });
  

// ✅ Mongoose Schemas
// const userSchema = new mongoose.Schema({ username:{type: String,required:true} });
 // const _id: mongoose.Schema.Types.ObjectId;

const User = mongoose.model('ExerciseUser', userSchema);

const exerciseSchema = new mongoose.Schema({
  // userId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExerciseUser' },
  userId: String,
  description: String,
  duration: Number,
  date: Date
});
const Exercise = mongoose.model('Exercise', exerciseSchema);

// ✅ POST /api/users
app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  console.log('👉 Received username:', username); // Debug log
  try {
    const user = new User({ username });
    const savedUser = await user.save();
    res.json({ username: savedUser.username, _id: savedUser._id });
  } catch (err) {
    console.error('❌ Error while saving user:', err.message);
    res.status(500).json({ error: 'User creation failed' });
  }
});

// ✅ GET /api/users
app.get('/api/users', async (req, res) => {
  const users = await User.find({}, 'username _id');
  res.json(users);
});

// ✅ POST /api/users/:_id/exercises
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { description, duration, date } = req.body;
  const userId = req.params._id;
  const actualDate = date ? new Date(date) : new Date();

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const exercise = new Exercise({
      userId,
      description,
      duration: parseInt(duration),
      date: actualDate
    });

    const savedExercise = await exercise.save();

    res.json({
      _id: user._id,
      username: user.username,
      description: savedExercise.description,
      duration: savedExercise.duration,
      date: savedExercise.date.toDateString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add exercise' });
  }
});

// ✅ GET /api/users/:_id/logs
// app.get('/api/users/:_id/logs', async (req, res) => {
//   const { from, to, limit } = req.query;
//   const userId = req.params._id;

//   try {
//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ error: 'User not found' });

//     let query = { userId };

//     if (from || to) {
//       query.date = {};
//       if (from) query.date.$gte = new Date(from);
//       if (to) query.date.$lte = new Date(to);
//     }

//     let quer = Exercise.find(filter).select('description duration date');
//     if (limit) quer = quer.limit(parseInt(limit));

//     const exercises = await query.exec();
//     const log = exercises.map(e => ({
//         description: e.description,
//         duration: e.duration,
//         date: e.date.toDateString()
//       }));
  
//     res.json({
//       _id: user._id,
//       username: user.username,
//       count: log.length,
//       log
//     });
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to retrieve logs' });
//   }
// });

// app.get('/api/users/:_id/logs', async (req, res) => {
//   const { from, to, limit } = req.query;
//   const userId = req.params._id;

//   try {
//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ error: 'User not found' });

//     let filter = { userId };

//     if (from || to) {
//       filter.date = {};
//       if (from) filter.date.$gte = new Date(from);
//       if (to) filter.date.$lte = new Date(to);
//     }

//     let query = Exercise.find(filter).select('description duration date');
//     if (limit) query = query.limit(parseInt(limit));

    // const exercises = await query.exec();

    // const log = exercises.map(e => ({
    //   description: e.description,
    //   duration: e.duration,
    //   date: e.date.toDateString()
    // }));

//     res.json({
//       _id: user._id,
//       username: user.username,
//       count: log.length,
//       log
//     });
//   } catch (err) {
//     console.error('❌ Log retrieval failed:', err);
//     res.status(500).json({ error: 'Failed to retrieve logs' });
//   }
// });

app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  const userId = req.params._id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // let filter = { userId };

    let filter = { userId: userId };

    if (from || to) {
      filter.date = {};
      if (from && !isNaN(Date.parse(from))) filter.date.$gte = new Date(from);
      if (to && !isNaN(Date.parse(to))) filter.date.$lte = new Date(to);
    }

    let query = Exercise.find(filter).select('description duration date');
    if (limit) query = query.limit(parseInt(limit));

    const exercises = await query.exec();

    const log = exercises.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString()
    }));

    res.json({
      _id: user._id,
      username: user.username,
      count: log.length,
      log
    });
  } catch (err) {
    console.error('❌ Log retrieval failed:', err);
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});



// ✅ Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

module.exports=app;
