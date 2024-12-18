import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { application } from "express";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const user = req.user._id;

  //TODO: create playlist

  if (!(name || description)) {
    throw new ApiError(404, "Name and Description is missing");
  }

  const existingPlaylist = await Playlist.findOne({
    $and: [{ name: name }, { owner: user }],
  });

  if (existingPlaylist) {
    throw new ApiError(400, "Playlist with this name already exist");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: user,
  });

  if (!playlist) {
    throw new ApiError(500, "Error while creating playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist Created Successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists

  if (!isValidObjectId(userId)) {
    throw new ApiError(404, "Invaluid User Id");
  }

  const userPlaylist = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "createdBy",
              pipeline: [
                {
                  $project: {
                    createdBy: {
                      fullName: 1,
                      username: 1,
                      avatar: 1,
                    },
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
              title: 1,
              thumbnail: 1,
              description: 1,
              owner: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "createdBy",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        createdBy: {
          $first: "$createdBy",
        },
      },
    },
    {
      $project: {
        videos: 1,
        name: 1,
        description: 1,
        createdBy: 1,
      },
    },
  ]).toArray();

  if (userPlaylist.length === 0) {
    throw new ApiError(504, "Something went wrong while fetching playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, userPlaylist, "User Playlist Fetched Successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(504, "Invalid Playlist Id");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: new mongoose.Types.ObjectId(playlistId),
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "createdBy",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
          {
            $addFields: {
              $first: "$createdBy",
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              createdBy: {
                $first: "$owner",
              },
            },
          },
          {
            $project: {
              title: 1,
              duration: 1,
              thumbnail: 1,
              createdAt: 1,
              updatedAt: 1,
              owner: 1,
              views: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        videos: 1,
        name: 1,
        description: 1,
        createdBy: 1,
      },
    },
  ]);

  if (!playlist.length === 0) {
    throw new ApiError(504, "Something went wrong while fetching playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist Fetched Successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(404, "Invalid Playlist Id ");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(404, "Invalid Video Id ");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "No Playlist Found");
  }

  if (Playlist.owner !== req.user_id) {
    throw new ApiError(
      403,
      "You dont't have permission to modify the playlist"
    );
  }

  const videoExist = await playlist.videos.includes(videoId); //revisit this line for checking

  if (videoExist.length > 0) {
    throw new ApiError(401, "Video Already Exist in the Playlist");
  }

  const addedVideo = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        videos: [...playlist.videos, videoId],
      },
    },
    {
      new: true,
    }
  );

  if (!addedVideo) {
    throw new ApiError(
      500,
      "Something went wrong while adding video to playlist"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        addedVideo,
        "Video Added in the Playlist Successfully"
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist

  if (isValidObjectId(playlistId)) {
    throw new ApiError(401, "Invalid Playlist Id");
  }

  if (isValidObjectId(videoId)) {
    throw new ApiError(401, "Invalid Video Id");
  }

  const playlist = await Playlist.findById(playlistId);

  if (playlist.owner !== req.user._id) {
    throw new ApiError(
      403,
      "You don't have the permission to modify the Playlist"
    );
  }

  const videoExist = playlist.videos.includes(videoId);

  if (!videoExist) {
    throw new ApiError(403, "Video not found in the playlist to remove");
  }

  const modifiedPlaylist = playlist.videos.filter(
    (video) => video._id !== videoId
  );

  const removeVideo = await Playlist.findByIdAndUpdate(playlistId, {
    $set: {
      videos: modifiedPlaylist,
    },
  });

  if (!removeVideo) {
    throw new ApiError(500, "Something went wrong while removing video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, removeVideo, "Video Removed Successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist

  if (isValidObjectId(playlistId)) {
    throw new ApiError(401, "Invalid Playlist Id");
  }

  const playlist = await Playlist.findById(playlistId);

  if (playlist.owner !== req.user._id) {
    throw new ApiError(
      403,
      "You don't have the permission to delete the Playlist"
    );
  }

  const removePlaylist = await Playlist.findByIdAndDelete(playlistId);

  if (!removePlaylist) {
    throw new ApiError(500, "Something went wrong while deleting playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, removePlaylist, "Playlist Deleted Successfully")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist

  if (isValidObjectId(playlistId)) {
    throw new ApiError(401, "Invalid Playlist Id");
  }

  const playlist = await Playlist.findById(playlistId);

  if (playlist.owner !== req.user._id) {
    throw new ApiError(
      403,
      "You don't have the permission to modify the Playlist"
    );
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
    $set: {
      name,
      description,
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Playlist Updated Successfully")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
