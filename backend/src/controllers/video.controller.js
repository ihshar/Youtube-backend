import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, uploadOnCloudinay} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    if(!isValidObjectId(userId)){
        throw new ApiError(404,"User Not Found")
    }

    const videos = await Video.aggregate([
        {
            $match:{
                $or:[
                    {
                        title:{$regex: query ,options:i}
                    },
                    {
                        description:{$regex: query ,options:i}
                    }
                ]
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"createdBy"
            }
        },
        {
            $unwind:"$createdBy"
        },
        {
            $project:{
                videoFile:1,
                thumbnail:1,
                title:1,
                description:1,
                createdBy:{
                    username:1,
                    fullName:1,
                    avatar:1
                }
            }
        },
        {
            $sort:{
                [sortBy]: sortType === asc ? 1 : -1
            }
        },
        {
            $skip: (page - 1) * limit,
        },
        {
            $limit: parseInt(limit),
        },
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,videos,"All Videos Fetched Successfully"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if(!(title || description)){
        throw new ApiError(401,"All fields are required")
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path

    if(!videoFileLocalPath){
        throw new ApiError(401,"Video File is missing")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)

    if(!videoFile){
        throw new ApiError(500,"Something went wrong while uploading Video File on cloudinary")
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if(!thumbnailLocalPath){
        throw new ApiError(401,"Thumbnail File is missing")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!thumbnail){
        throw new ApiError(500,"Something went wrong while uploading Thumbnail File on cloudinary")
    }

    const video = await Video.create({
        videoFile:videoFile.url,
        thumbnail:thumbnail.url,
        title,
        description,
        duration:videoFile.duration,
        owner:req.user._id
    })

    if(!video){
        throw new ApiError(500,"Error while publishing the Video")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,video,"Video Published Successfuly"))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    try {
        if(!isValidObjectId(videoId)){
            throw new ApiError(401,"Invalid Video Id")
        }
    
        const video = await Video.findById(videoId)
    
        if(!video){
            throw new ApiError(404,"Video not found")
        }
    
        res
        .status(200)
        .json(new ApiResponse(200,video.url,"Video Fetched Successfully"))
    } catch (error) {
        console.log("Error while retrieving video")
        throw new ApiError(500,"Internal Server Error")
    }
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const {title,description} = req.body
    const thumbnailLocalPath = req.files[0]?.path
    const videoFileLocalPath = req.files[0]?.path
    
    if(!isValidObjectId(videoId)){
        throw new ApiError(401,"Invalid Video Id")
    }

    if(!(title || description)){
        throw new ApiError(400,"title or description is missing")
    }

    if(!thumbnailLocalPath){
        throw new ApiError(404,"Thumbnail File is missing")
    }
    
    if(!videoFileLocalPath){
        throw new ApiError(404,"Video File is missing")
    }

    const thumbnail = uploadOnCloudinary(thumbnailLocalPath)
    const videoFile = uploadOnCloudinay(videoFileLocalPath)
    
    if(!thumbnail){
        throw new ApiError(500,"Something went wrong while uploading thumbnail on cloudinary")
    }
    
    if(!videoFile){
        throw new ApiError(500,"Something went wrong while uploading video on cloudinary")
    }

    const video = await Video.findById(videoId)

    if(video.owner !== req.user._id){
        throw new ApiError(401,"You Don't have Permission to Update Video")
    }

    const updateVideo = await Video.findByIdAndUpdate(videoId,
        {
            $set:{
                videoFile:videoFile.url,
                title,
                description,
                thumbnail:thumbnail.url,
            },
        },
        {
            new:true
        }
    )
    
    return res
    .status(200)
    .json(new ApiResponse(200,updateVideo,"Video Updated Successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if(!isValidObjectId(videoId)){
        throw new ApiError(401,"Invalid Video Id")
    }

    const video = await Video.findById(videoId)

    if(video.owner !== req.user._id){
        throw new ApiError(401,"You Don't have permission to delete video")
    }

    const deleteVideo = await Video.findByIdAndUpdate(videoId)

    if(deleteVideo){
        throw new ApiError(500,"Something went wrong while deleting video")
    }

    return res
    .status(200)
    .json(new ApiError(200,{},"Video Deleted Successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(401,"Invalid Video Id")
    }

    const video = await Video.findById(videoId)

    if(video.owner !== req.user._id){
        throw new ApiError(401,"You Don't have permission to change publish status video")
    }

    const publishStatusToggle = await Video.findByIdAndUpdate(videoId,
        {
            $set:{
                isPublished:!isPublished
            }
        },
        {
            new:true,
        }
    )

    return res
    .status(200)
    .json(new ApiResponse(200,publishStatusToggle,"Toggle Publish Successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}