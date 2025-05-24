const admin = require('firebase-admin');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers?.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('No token provided in request');
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('Decoded Firebase token:', {
      uid: decodedToken.uid,
      email: decodedToken.email
    });

    const user = await User.findOne({ uid: decodedToken.uid });
    console.log('Found user in database:', {
      found: !!user,
      userId: user?._id,
      userUid: user?.uid,
      userEmail: user?.email
    });
    
    if (!user) {
      console.error('User not found in database for Firebase UID:', decodedToken.uid);
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = verifyToken; 