const admin = require('firebase-admin');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers?.authorization;
    console.log('Auth header present:', !!authHeader);
    
    const token = authHeader?.split(' ')[1];
    if (!token) {
      console.log('No token provided in request');
      return res.status(401).json({ 
        message: 'Unauthorized access',
        details: 'No token provided'
      });
    }

    console.log('Attempting to verify token...');
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('Token verified successfully:', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      exp: new Date(decodedToken.exp * 1000).toISOString()
    });

    const user = await User.findOne({ uid: decodedToken.uid });
    console.log('Database user lookup result:', {
      found: !!user,
      userId: user?._id,
      userUid: user?.uid,
      userEmail: user?.email
    });
    
    if (!user) {
      console.error('User not found in database for Firebase UID:', decodedToken.uid);
      return res.status(401).json({ 
        message: 'User not found',
        details: 'User exists in Firebase but not in database'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
      headers: {
        authorization: req.headers?.authorization ? 'Present' : 'Missing',
        contentType: req.headers['content-type']
      }
    });

    // Specific error messages for common issues
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        message: 'Token expired',
        details: 'Please log in again'
      });
    }
    if (error.code === 'auth/argument-error') {
      return res.status(401).json({ 
        message: 'Invalid token format',
        details: 'Token is malformed'
      });
    }
    
    res.status(401).json({ 
      message: 'Invalid token',
      details: error.message
    });
  }
};

module.exports = verifyToken; 