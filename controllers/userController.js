const User = require('../models/User');

const createOrUpdateUser = async (req, res) => {
  try {
    console.log('Create/Update user request:', {
      body: req.body,
      headers: {
        contentType: req.headers['content-type']
      }
    });

    const { name, email, photoURL, uid } = req.body;

    if (!uid) {
      console.error('Missing UID in request');
      return res.status(400).json({ message: 'UID is required' });
    }

    if (!email) {
      console.error('Missing email in request');
      return res.status(400).json({ message: 'Email is required' });
    }

    const userData = {
      name: name || email.split('@')[0], // Use part of email as name if not provided
      email,
      photoURL: photoURL || 'https://i.ibb.co/N6KP3bLy/image.png',
      uid
    };

    console.log('Attempting to create/update user with data:', userData);

    // First try to find by UID
    let user = await User.findOne({ uid });
    
    if (user) {
      console.log('Found existing user by UID, updating...');
      user = await User.findOneAndUpdate(
        { uid },
        userData,
        { new: true, runValidators: true }
      );
      console.log('User updated successfully');
      return res.status(200).json(user);
    } 

    // Then try to find by email
    user = await User.findOne({ email });
    if (user) {
      console.log('Found existing user by email, updating...');
      user = await User.findOneAndUpdate(
        { email },
        { ...userData },
        { new: true, runValidators: true }
      );
      console.log('User updated successfully');
      return res.status(200).json(user);
    }

    // If no existing user found, create new one
    console.log('No existing user found, creating new user...');
    user = new User(userData);
    await user.save();
    console.log('New user created successfully');
    res.status(201).json(user);

  } catch (error) {
    console.error('Create/Update user error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });

    if (error.code === 11000) {
      // Handle duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      console.log('Duplicate key error for field:', field);
      
      // Try to recover by finding and updating the existing user
      try {
        const existingUser = await User.findOne({ [field]: error.keyValue[field] });
        if (existingUser) {
          const updated = await User.findByIdAndUpdate(
            existingUser._id,
            { $set: req.body },
            { new: true, runValidators: true }
          );
          console.log('Recovered from duplicate key error by updating existing user');
          return res.status(200).json(updated);
        }
      } catch (recoveryError) {
        console.error('Error during duplicate key recovery:', recoveryError);
      }
    }

    res.status(500).json({ 
      message: 'Error creating/updating user',
      error: error.message 
    });
  }
};

const getUserProfile = async (req, res) => {
  try {
    console.log('Fetching profile for user:', req.user._id);
    
    const user = await User.findById(req.user._id)
      .populate('joinedGroups')
      .populate('createdGroups');
    
    if (!user) {
      console.error('User not found:', req.user._id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User profile fetched successfully');
    res.status(200).json(user);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ 
      message: 'Error fetching user profile',
      error: error.message 
    });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { name, photoURL } = req.body;
    console.log('Updating profile for user:', req.user._id);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 
        name: name || 'User',
        photoURL: photoURL || 'https://i.ibb.co/K7Vkt4m/default-avatar.png'
      },
      { new: true }
    );

    if (!updatedUser) {
      console.error('User not found for update:', req.user._id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User profile updated successfully');
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ 
      message: 'Error updating user profile',
      error: error.message 
    });
  }
};

module.exports = {
  createOrUpdateUser,
  getUserProfile,
  updateUserProfile
}; 