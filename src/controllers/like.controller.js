import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  const user = req.user._id;

  if (isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const videoLike = await Like.findOne({
    $and: [{ video: videoId }, { likedBy: user }],
  });

  if (!videoLike) {
    const like = await Like.create({
      video: videoId,
      likedBy: user,
    });
    if (!like) {
      throw new ApiError("Something went wrong while liking the video");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, like, "User liked the Video"));
  }

  //revisit this
  if (videoLike) {
    const unLike = Like.findByIdAndDelete(videoLike._id);

    if (!unLike) {
      throw new ApiError("Something went wrong while unLiking the video");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, unLike, "User unliked the Video Successfully   ")
      );
  }

  // if(videoLike){
  //     const unLike = await Like.findByIdAndUpdate(likedVideo._id)
  // }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  const user = req.user._id;
  if (isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment Id");
  }

  const likeComment = await Like.findOne({
    $and: [{ $comment: commentId }, { likedBy: user }],
  });

  if (!likeComment) {
    const like = await Like.create({
      comment: commentId,
      likedBy: user,
    });

    if (!like) {
      throw new ApiError(500, "Something went wrong while liking the comment");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, like, "Comment liked Successfully"));
  }

  if (likeComment) {
    const unLike = await Like.findByIdAndDelete(likeComment._id);

    if (!unLike) {
      throw new ApiError("Something went wrong while unLiking the comment");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, unLike, "User unliked the Comment Successfully")
      );
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  const user = req.user._id;

  if (isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet Id");
  }

  const likeTweet = await Like.findOne({
    $and: [{ likedBy: user }, { tweet: tweetId }],
  });

  if (!likeTweet) {
    const like = await Like.create({
      likedBy: user,
      tweet: tweetId,
    });

    if (!like) {
      throw new ApiError(500, "Something went wrong while liking the Tweet");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, like, "Tweet liked Successfully"));
  }

  if (likeTweet) {
    const unLike = await Like.findByIdAndDelete(likeTweet._id);

    if (!unLike) {
      throw new ApiError("Something went wrong while unLiking the Tweet");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, unLike, "User unliked the Tweet Successfully")
      );
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const user = req.user._id;

  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(user),
        video: {
          $exist: true,
          $ne: null,
        },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "likedBy",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName,
                    username,
                    avatar,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
          {
            $project: {
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              duration: 1,
              views: 1,
              owner: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: $video,
    },
    {
      $project: {
        video: 1,
        likedBy: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked Video Fetched Successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
