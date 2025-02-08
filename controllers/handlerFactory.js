import ApiFeatures from "../utilities/apiFeatures.js";
import catchAsync from "../utilities/catchAsync.js";
import AppError from "../utilities/appError.js";

const getModelName = (Model) => Model.modelName.toLowerCase();

export const getAll = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    // adding filters later
    let filter = {};

    const features = new ApiFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate()
      .search();

    let query = features.query;
    if (popOptions) query.populate(popOptions);
    const doc = await query;

    const total = await new ApiFeatures(Model.find(filter), req.query)
      .filter()
      .search()
      .query.countDocuments();

    const name = `${getModelName(Model)}`.endsWith("y")
      ? `${getModelName(Model)}`.replace(/.$/, "ies")
      : `${getModelName(Model)}s`;

    res.status(200).json({
      status: "success",
      result: doc.length,
      total,
      data: {
        [name]: doc,
      },
    });
  });

export const getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError(`No ${getModelName(Model)} found with that ID.`, 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        [`${getModelName(Model)}`]: doc,
      },
    });
  });

export const createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    await Model.create(req.body);

    res.status(201).json({
      status: "success",
      message: `${getModelName(Model)} has been created successfully!`,
    });
  });

export const updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError(`No ${getModelName(Model)} found with that ID.`, 404));
    }

    res.status(200).json({
      status: "success",
      message: `${getModelName(Model)} has been updated successfully!`,
    });
  });

export const deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError(`No ${getModelName(Model)} found with that ID.`, 404));
    }

    res.status(204).json(null);
  });

// TODO: Add isOwnerGet / isOwnerUpdate / isOwnerDelete when needed.
