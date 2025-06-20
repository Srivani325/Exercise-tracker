const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

app.use(cors());
app.use(express.urlencoded({ extended: false}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
});

const exerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true }
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// Routes

// POST /api/users
// app.post('/api/users', async (req, res) => {
//   const user = new User({ username: req.body.username });
//   const savedUser = await user.save();
//   res.json({ username: savedUser.username, _id: savedUser._id });
// });

// app.post('/api/users', async (req, res) => {
//     const { username } = req.body;
//     if (!username) {
//       return res.status(400).json({ error: 'Username is required' });
//     }
  
//     try {
//       const newUser = await User.create({ username });
//       res.json({ username: newUser.username, _id: newUser._id });
//     } catch (err) {
//        console.error('User creation error:', err);  
//        res.status(500).json({ error: 'Failed to create user' });
//     }
//   });
  

app.post('/api/users', async (req, res) => {
    console.log('BODY:', req.body);  // ✅ Log incoming body
  
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
  
    try {
      const newUser = await User.create({ username });
      res.json({ username: newUser.username, _id: newUser._id });
    } catch (err) {
      console.error('User creation error:', err);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });
  

// GET /api/users
// app.get('/api/users', async (req, res) => {
//   const users = await User.find({}, 'username _id');
//   res.json(users);
// });


app.get('/api/users', async (req, res) => {
    try {
      // const users = await User.find({}, '_id username');
      const users = await User.find(
      { username: { $exists: true, $ne: null } },  // 👍 only users with a username
      'username _id'  // 👍 only return username and _id
    );
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  

// POST /api/users/:_id/exercises
// app.post('/api/users/:_id/exercises',async(req,res)=>{
//     const { description, duration, date } = req.body;
//     const userId = req.params._id;

//     const actualDate = date ? new Date(date) : new Date();

//     if (!description || !duration) {
//     return res.status(400).json({ error: 'Description and duration are required' });
//     }

//     // make sure duration is a number
//     const durationNumber = Number(duration);
//     if (isNaN(durationNumber)) {
//     return res.status(400).json({ error: 'Duration must be a number' });
//     }

//     try {
//     const user = await User.findById(userId);
//     if (!user) {
//         return res.status(404).json({ error: 'User not found' });
//     }

//     const exercise = new Exercise({
//         userId: user._id,
//         description,
//         duration: durationNumber,
//         date: actualDate
//     });

//     await exercise.save();

//     res.json({
//         _id: user._id,
//         username: user.username,
//         date: actualDate.toDateString(),
//         duration: durationNumber,
//         description
//     });

// } catch (err) {
//   console.error('Exercise POST error:', err);
//   res.status(500).json({ error: 'Server error' });
// }

// });


app.post('/api/users/:_id/exercises', async (req, res) => {
    const { description, duration, date } = req.body;
    const userId = req.params._id;
  
    if (!description || !duration) {
      return res.status(400).json({ error: 'Description and duration are required' });
    }
  
    const durationNumber = Number(duration);
    if (isNaN(durationNumber)) {
      return res.status(400).json({ error: 'Duration must be a number' });
    }
  
    const actualDate = date ? new Date(date) : new Date();
  
    if (actualDate.toString() === 'Invalid Date') {
      return res.status(400).json({ error: 'Invalid date format' });
    }
  
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const exercise = new Exercise({
        userId: user._id,
        description,
        duration: durationNumber,
        date: actualDate
      });
  
      await exercise.save();
  
      res.json({
        _id: user._id,
        username: user.username,
        date: actualDate.toDateString(),
        duration: durationNumber,
        description
      });
  
    } catch (err) {
      console.error('Exercise POST error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  

// GET /api/users/:_id/logs
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const { from, to, limit } = req.query;
    const user = await User.findById(req.params._id);
    if (!user) return res.status(400).json({ error: 'User not found' });

    let filter = { userId: user._id };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    let query = Exercise.find(filter).select('description duration date');
    if (limit) query = query.limit(parseInt(limit));

    const exercises = await query.exec();

    res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log: exercises.map(ex => ({
        description: ex.description,
        duration: ex.duration,
        date: ex.date.toDateString()
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});


module.exports = app;
