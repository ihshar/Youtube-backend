import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet

  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is missing ");
  }

  if (!isValidObjectId(req.user._id)) {
    throw new ApiError(404, "Invalid User Id");
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user._id,
  });

  if (!tweet) {
    throw new ApiError(500, "Something went wrong while creating a tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet Created Successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets

  const userId = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User Id");
  }

  const tweet = await Tweet.find({ owner: userId });

  if (tweet.length === 0) {
    throw new ApiError(404, "No Tweets Found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweets Fetched Sucessfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet

  const { tweetId } = req.params;

  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is missing ");
  }

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet Id");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedTweet) {
    throw new ApiError(500, "Something went wrong while updating a tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updateTweet, "Tweet Updated Sucessfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet

  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet Id");
  }

  const tweet = await Tweet.findById(tweetId);

  if (tweet.owner !== req.user._id) {
    throw new ApiError(
      401,
      "You don't have the permission to delete the Tweet"
    );
  }

  const deletingTweet = await Tweet.findByIdAndDelete(tweetId);

  if (!deletingTweet) {
    throw new ApiError(500, "Something went wrong while deleting a tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet Deleted Sucessfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
