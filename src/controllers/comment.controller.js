import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    const comments = await Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"createdBy",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullName:1,
                            avatar:1,
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                createdBy:{
                    $first:"$createdBy"
                }
            }
        },
        {
            $unwind: "$createdBy"
        },
        {
            $project:{
                content:1,
                createdBy:1
            }
        },
        {
          $skip: (page - 1) * limit,
        },
        {
          $limit: parseInt(limit),
        }
    ]);
  
    return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments Fetched"));
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    const {videoId} = req.params
    const {content} = req.body

    if(!videoId){
        throw new ApiError(404,"Video Not Found")
    }

    if(!content){
        throw new ApiError(400,"Comment Content is missing")
    }

    const comment = await Comment.create({
        content,
        video:videoId,
        owner:req.user?._id
    })

    if(!comment){
        throw new ApiError(500,"Error while saving the Comment")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,comment,"Comment Added Successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const {commentId} = req.params
    const {content} = req.body

    if(!content){
        throw new ApiError(400,"Comment Content is missing")
    }

    if(!isValidObjectId(commentId)){
        throw new ApiError(404,"Comment Not Found")
    }

    const originalComment = await Comment.findById(commentId)

    if(!originalComment?.owner !== req.user?._id){
        throw new ApiError(403,"You Don't have the permission to updated the comment")
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId,
        {
            $set:{
                content,
            }
        },
        {
            new:true,
        }
    )

    if(!updatedComment){
        throw new ApiError(500,"Error while saving the Updating Comment")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,updatedComment,"Comment Updated Successfully"))

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const {commentId} = req.params

    const comment = await Comment.findById(commentId)
    if(!isValidObjectId(commentId)){
        throw new ApiError(404,"Comment Not Found")
    }
    
    if(comment.owner !== req.user?._id){
        throw new ApiError(403,"You Don't have the permission to delete the comment")
    }
    const deletedComment = await Comment.findByIdAndDelete(commentId)

    if(deletedComment){
        throw new ApiError(500,"Error while deleting Comment") // this should be revisited
    }

    return res
    .status(200)
    .json(new ApiResponse(200,deleteComment,"Comment Deleted Successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }