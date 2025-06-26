const Group = require('../models/Group');
const User = require('../models/User');

const createGroup = async (req, res) => {
  try {
    const { name, category, description, imageURL, location, maxMembers, startDate } = req.body;
    
    console.log('Creating group:', {
      name,
      category,
      description,
      location,
      maxMembers,
      startDate,
      userId: req.user._id,
      imageSize: imageURL ? Math.round(imageURL.length * 0.75) : 0
    });

    if (!name || !category || !description || !imageURL || !location || !maxMembers || !startDate) {
      console.log('Missing required fields:', {
        hasName: !!name,
        hasCategory: !!category,
        hasDescription: !!description,
        hasImage: !!imageURL,
        hasLocation: !!location,
        hasMaxMembers: !!maxMembers,
        hasStartDate: !!startDate
      });
      return res.status(400).json({ message: 'All fields are required' });
    }

    const MAX_IMAGE_SIZE = 20 * 1024 * 1024; 
    const imageSize = Math.round(imageURL.length * 0.75); 
    if (imageSize > MAX_IMAGE_SIZE) {
      console.error('Image too large:', {
        size: imageSize,
        maxSize: MAX_IMAGE_SIZE
      });
      return res.status(400).json({ message: 'Image size should be less than 20MB' });
    }

    if (maxMembers < 2 || maxMembers > 100) {
      return res.status(400).json({ message: 'Maximum members must be between 2 and 100' });
    }

    const startDateObj = new Date(startDate);
    if (isNaN(startDateObj.getTime())) {
      return res.status(400).json({ message: 'Invalid start date' });
    }

    if (!['Art', 'Music', 'Sports', 'Technology', 'Books', 'Gaming', 'Cooking', 'Fitness', 'Photography', 'Other'].includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const group = new Group({
      name,
      category,
      description,
      imageURL,
      location,
      maxMembers,
      startDate: startDateObj,
      creator: req.user._id,
      members: [req.user._id]
    });

    console.log('Saving group with data:', {
      name: group.name,
      category: group.category,
      creator: group.creator,
      imageSize
    });

    try {
      await group.save();
    } catch (saveError) {
      console.error('Error saving group to database:', {
        error: saveError.message,
        code: saveError.code,
        name: saveError.name
      });
      throw saveError;
    }

    try {
      const updatedUser = await User.findOneAndUpdate(
        { _id: req.user._id },
        {
          $addToSet: { 
            createdGroups: group._id,
            joinedGroups: group._id
          }
        },
        { new: true }
      );

      console.log('Updated user groups:', {
        userId: updatedUser._id,
        createdGroupsCount: updatedUser.createdGroups.length,
        joinedGroupsCount: updatedUser.joinedGroups.length
      });
    } catch (userUpdateError) {
      console.error('Error updating user groups:', {
        error: userUpdateError.message,
        userId: req.user._id
      });
      
      await Group.findByIdAndDelete(group._id);
      throw userUpdateError;
    }

    try {
      const populatedGroup = await Group.findById(group._id)
        .populate('creator', 'name photoURL')
        .populate('members', 'name photoURL');

      console.log('Group created successfully:', {
        groupId: populatedGroup._id,
        name: populatedGroup.name,
        creatorId: populatedGroup.creator._id
      });

      res.status(201).json(populatedGroup);
    } catch (populateError) {
      console.error('Error populating group data:', {
        error: populateError.message,
        groupId: group._id
      });
      throw populateError;
    }
  } catch (error) {
    console.error('Create group error details:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      console.log('Validation errors:', validationErrors);
      return res.status(400).json({ message: validationErrors.join(', ') });
    }

    if (error.code === 11000) {
      return res.status(400).json({ message: 'A group with this name already exists' });
    }

    if (error.message.includes('request entity too large')) {
      return res.status(400).json({ 
        message: 'Image size is too large. Please use a smaller image or compress it further.'
      });
    }

    res.status(500).json({ 
      message: 'Error creating group',
      details: error.message 
    });
  }
};

const getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('creator', 'name photoURL')
      .populate('members', 'name photoURL');
    // Ensure all required fields are present
    const safeGroups = groups.map(group => ({
      _id: group._id,
      name: group.name,
      description: group.description,
      imageURL: group.imageURL,
      location: group.location || null,
      startDate: group.startDate || null,
      members: Array.isArray(group.members) ? group.members : [],
      maxMembers: group.maxMembers,
      category: group.category,
      creator: group.creator,
      isActive: group.isActive,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt
    }))
    res.status(200).json(safeGroups);
  } catch (error) {
    console.error('Get all groups error:', error);
    res.status(500).json({ message: 'Error fetching groups' });
  }
};

const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('creator', 'name photoURL')
      .populate('members', 'name photoURL');
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.status(200).json(group);
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ message: 'Error fetching group' });
  }
};

const updateGroup = async (req, res) => {
  try {
    const { name, category, description, imageURL, location, maxMembers, startDate } = req.body;
    
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this group' });
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      req.params.id,
      { name, category, description, imageURL, location, maxMembers, startDate },
      { new: true }
    ).populate('creator', 'name photoURL')
     .populate('members', 'name photoURL');

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ message: 'Error updating group' });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this group' });
    }

    await User.updateMany(
      { _id: { $in: group.members } },
      { $pull: { joinedGroups: group._id } }
    );

    await User.findByIdAndUpdate(group.creator, {
      $pull: { createdGroups: group._id }
    });

    await Group.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ message: 'Error deleting group' });
  }
};

const joinGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.members.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already a member of this group' });
    }

    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ message: 'Group is full' });
    }

    if (new Date(group.startDate) < new Date()) {
      return res.status(400).json({ message: 'Group has already started' });
    }

    await Group.findByIdAndUpdate(req.params.id, {
      $push: { members: req.user._id }
    });

    await User.findByIdAndUpdate(req.user._id, {
      $push: { joinedGroups: req.params.id }
    });

    const updatedGroup = await Group.findById(req.params.id)
      .populate('creator', 'name photoURL')
      .populate('members', 'name photoURL');

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ message: 'Error joining group' });
  }
};

const leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.members.includes(req.user._id)) {
      return res.status(400).json({ message: 'Not a member of this group' });
    }

    if (group.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Creator cannot leave the group' });
    }

    await Group.findByIdAndUpdate(req.params.id, {
      $pull: { members: req.user._id }
    });

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { joinedGroups: req.params.id }
    });

    const updatedGroup = await Group.findById(req.params.id)
      .populate('creator', 'name photoURL')
      .populate('members', 'name photoURL');

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ message: 'Error leaving group' });
  }
};

const getCreatedGroups = async (req, res) => {
  try {
    console.log('getCreatedGroups called for user:', {
      userId: req.user._id,
      userUid: req.user.uid,
      userEmail: req.user.email
    });

    const groups = await Group.find({ creator: req.user._id })
      .populate('creator', 'name photoURL')
      .populate('members', 'name photoURL')
      .sort({ createdAt: -1 }); // Sort by newest first

    console.log('Found created groups:', {
      count: groups.length,
      groupIds: groups.map(g => g._id),
      groups: groups.map(g => ({
        id: g._id,
        name: g.name,
        creator: g.creator._id
      }))
    });

    res.status(200).json(groups);
  } catch (error) {
    console.error('Get created groups error:', {
      error: error.message,
      userId: req.user._id,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Error fetching created groups',
      details: error.message
    });
  }
};

const getJoinedGroups = async (req, res) => {
  try {
    console.log('getJoinedGroups called for user:', {
      userId: req.user._id,
      userUid: req.user.uid,
      userEmail: req.user.email
    });

    const groups = await Group.find({ 
      members: req.user._id,
      creator: { $ne: req.user._id } 
    })
      .populate('creator', 'name photoURL')
      .populate('members', 'name photoURL')
      .sort({ createdAt: -1 }); 

    console.log('Found joined groups:', {
      count: groups.length,
      groupIds: groups.map(g => g._id),
      groups: groups.map(g => ({
        id: g._id,
        name: g.name,
        creator: g.creator._id
      }))
    });

    res.status(200).json(groups);
  } catch (error) {
    console.error('Get joined groups error:', {
      error: error.message,
      userId: req.user._id,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Error fetching joined groups',
      details: error.message
    });
  }
};

module.exports = {
  createGroup,
  getAllGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  getCreatedGroups,
  getJoinedGroups
};