import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    try {
        const {channelId} = req.params
        // TODO: toggle subscription
    
        const userId = req.user._id
    
        const channel = await User.findById(channelId)
    
        if(!channel){
            throw new ApiError(404,"Channel Not Found")
        }
    
        const isSubscribed = await Subscription.findOne({subscriber:userId,channel:channelId})
    
        if(isSubscribed){
            await isSubscribed.remove()
            res
            .status(200)
            .json(new ApiResponse(200,{},"Unsubscribed Successfully"))
        }
        else{
            isSubscribed.create({
                subscriber:userId,
                channel:channelId
            })

            res
            .status(200)
            .json(new ApiResponse(200,{},"Subscribed Successfully"))
        }
    } catch (error) {
        console.log("Error while toggling")
        throw new ApiError(500,"Internal Server Error" || error?.message)
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(401,"Invalid Channel Id")
    }

    try {
        const subscriber = await Subscription.find({channel:channelId}).populate("subscriber","username")
    
        res
        .status(200)
        .json(new ApiResponse(200,subscriber,"Subscriber Retrieved Successfully"))
    } catch (error) {
        console.log("Error while retrieving subscription")
        throw new ApiError(500,"Internal Server Error" || error?.message)
    }
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(401,"Invalid Subscriber Id")
    }

    try {
        const channel = await Subscription.find({subscriber:subscriberId}).populate("channel","username")
    
        res
        .status(200)
        .json(new ApiResponse(200,channel,"Channel List Retrieved Successfully"))
    
    } catch (error) {
        console.log("Error while retrieving channel list")
        throw new ApiError(500,"Internal Server Error" || error?.message)
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}