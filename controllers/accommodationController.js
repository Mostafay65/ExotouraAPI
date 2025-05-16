import Accommodation from "../models/accommodationModel.js";
import catchAsync from "../utilities/catchAsync.js";
import {
  getAll,
  getOne,
  createOne,
  isOwnerUpdateOne,
  isOnwerDeleteOne,
} from "./handlerFactory.js";

const popOptions = {
  path: "owner",
  select: "profileDescription rating status email phoneNumber fullName profilePicture ",
};

export const getAllAccommodations = catchAsync(async (req, res, next) => {
  const filter = {};
  if (req.params.id) filter.owner = req.params.id;
  getAll(Accommodation, "", filter)(req, res, next);
});

export const getAccommodationsOnMap = catchAsync(async (req, res, next) => {
  // Expecting coordinates from frontend as:
  // req.query.blLng, req.query.blLat, req.query.trLng, req.query.trLat
  const { blLng, blLat, trLng, trLat } = req.query;

  if (
    blLng === undefined ||
    blLat === undefined ||
    trLng === undefined ||
    trLat === undefined
  ) {
    return res.status(400).json({
      status: "fail",
      message: "Please provide blLng, blLat, trLng, and trLat as query parameters.",
    });
  }

  const accommodations = await Accommodation.aggregate([
    {
      $match: {
        "location.coordinates": {
          $geoWithin: {
            $box: [
              [parseFloat(blLat), parseFloat(blLng)],
              [parseFloat(trLat), parseFloat(trLng)],
            ],
          },
        },
      },
    },
    { $sample: { size: 50 } },
    { $project: { name: 1, _id: 1, location: 1 } },
  ]);

  res.status(200).json({
    status: "success",
    results: accommodations.length,
    data: {
      accommodations,
    },
  });
});

export const getNearbyAccommodations = catchAsync(async (req, res, next) => {
  const { longitude, latitude, maxDistance = 10000 } = req.query; // maxDistance in meters, default 10km

  if (longitude === undefined || latitude === undefined) {
    return res.status(400).json({
      status: "fail",
      message: "Please provide longitude and latitude as query parameters.",
    });
  }

  const accommodations = await Accommodation.find({
    "location.coordinates": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(latitude), parseFloat(longitude)],
        },
        $maxDistance: parseInt(maxDistance),
      },
    },
  });

  res.status(200).json({
    status: "success",
    results: accommodations.length,
    data: {
      accommodations,
    },
  });
});

export const getAccommodationById = getOne(Accommodation, popOptions);

export const createAccommodation = createOne(Accommodation);

export const updateAccommodation = isOwnerUpdateOne(Accommodation);

export const deleteAccommodation = isOnwerDeleteOne(Accommodation);
