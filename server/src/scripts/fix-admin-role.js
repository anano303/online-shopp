const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const result = await mongoose.connection.db
    .collection('users')
    .updateOne({ email: 'admin@gmail.com' }, { $set: { role: 'admin' } });
  console.log('Updated:', result.modifiedCount);
  await mongoose.disconnect();
});
