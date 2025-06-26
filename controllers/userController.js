const User = require('../models/User');

const createOrUpdateUser = async (req, res) => {
  try {
    const { name, email, photoURL, uid } = req.body;

    if (!uid) {
      return res.status(400).json({ message: 'UID is required' });
    }

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const userData = {
      name: name || 'User',
      email,
      photoURL: photoURL || 'https://i.ibb.co/K7Vkt4m/default-avatar.png',
      uid
    };

    let user = await User.findOne({ uid });
    
    if (user) {
      user = await User.findOneAndUpdate(
        { uid },
        userData,
        { new: true }
      );
      return res.status(200).json(user);
    } 

    const existingUserWithEmail = await User.findOne({ email });
    if (existingUserWithEmail) {
      user = await User.findOneAndUpdate(
        { email },
        { ...userData },
        { new: true }
      );
      return res.status(200).json(user);
    }

    user = new User(userData);
    await user.save();
    res.status(201).json(user);

  } catch (error) {
    console.error('Create/Update user error:', error);
    if (error.code === 11000) {
      return res.status(200).json({ 
        message: 'User already exists',
        error: error.message 
      });
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