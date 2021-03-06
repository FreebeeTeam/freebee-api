const { check } = require('express-validator/check');
const { getValidationState } = require('../utils/validationHelper');
const Feedback = require('../models/feedback');
const { freebeeTypesModels } = require('../utils/freebeeTypes');
const { convertPointToGeoJSONPoint } = require('../utils/geo');

exports.getFeedback = function getFeedback(req, res) {
  const state = getValidationState(req);
  if (state.hasErrors) {
    return res.status(400).json({ errors: state.errors });
  }

  Feedback.find()
    .limit(100)
    .exec((err, feedback) => {
      if (err) {
        return res.status(500).json(err);
      }
      return res.status(200).json(feedback.map(f => f.toClient()));
    });
};

exports.getFeedbackById = function getFeedbackById(req, res) {
  const state = getValidationState(req);
  if (state.hasErrors) {
    return res.status(400).json({ errors: state.errors });
  }

  const { id } = req.params;

  Feedback.findById(id, (err, feedback) => {
    if (err) {
      return res.status(500).json(err);
    }

    return res.status(200).json(feedback.toClient());
  });
};

exports.createFeedback = function createFeedback(req, res) {
  const state = getValidationState(req);
  if (state.hasErrors) {
    return res.status(400).json({ errors: state.errors });
  }

  const {
    title,
    location,
    author,
    address,
    type,
    password,
    description,
  } = req.body;

  Feedback.create({
    title,
    location: convertPointToGeoJSONPoint(location),
    author,
    address,
    type,
    password,
    description,
  }, (err, feedback) => {
    if (err) {
      return res.status(500).json(err);
    }

    return res.status(201).json(feedback.toClient());
  });
};

exports.approveFeedback = function approveFeedback(req, res) {
  const state = getValidationState(req);
  if (state.hasErrors) {
    return res.status(400).json({ errors: state.errors });
  }

  const { type } = req.body;

  const freebeeTypeWithModel = Object.values(freebeeTypesModels)
    .find(typeModel => typeModel.type.toString() === type[0]);

  const MarkerModel = freebeeTypeWithModel.model;

  const marker = new MarkerModel({
    ...req.body,
    location: convertPointToGeoJSONPoint(req.body.location),
  });

  marker.save((err, createdMarker) => {
    if (err) {
      return res.status(500).json(err);
    }

    const { id } = req.body;
    Feedback.findByIdAndDelete(id, (deleteError) => {
      if (err) {
        return res.status(500).json(deleteError);
      }

      return res.status(201).json(createdMarker.toClient());
    });
  });
};

module.exports.updateFeedback = function updateFeedback(req, res) {
  const state = getValidationState(req);
  if (state.hasErrors) {
    return res.status(400).json({ errors: state.errors });
  }

  const {
    id,
    address,
    author,
    location,
    description,
  } = req.body;

  Feedback.findOneAndUpdate({ _id: id }, {
    location: convertPointToGeoJSONPoint(location),
    description,
    author,
    address,
  },
  { new: true },
  (err, feedback) => {
    if (err) {
      return res.status(500).json(err);
    }

    return res.status(200).json(feedback.toClient());
  });
};

exports.deleteFeedback = function deleteFeedback(req, res) {
  const state = getValidationState(req);
  if (state.hasErrors) {
    return res.status(400).json({ errors: state.errors });
  }

  const { id } = req.params;

  Feedback.findByIdAndDelete(id, (err) => {
    if (err) {
      return res.status(500).json(err);
    }

    return res.status(204).json();
  });
};

exports.deleteManyFeedback = function deleteManyFeedback(req, res) {
  const state = getValidationState(req);
  if (state.hasErrors) {
    return res.status(400).json({ errors: state.errors });
  }

  const { ids } = req.body;

  Feedback.deleteMany({
    _id: { $in: ids },
  }, (err) => {
    if (err) {
      return res.status(500).json(err);
    }

    return res.status(204).json();
  });
};

exports.validate = (method) => {
  switch (method) {
    case exports.getFeedback.name: {
      return [];
    }
    case exports.getFeedbackById.name: {
      return [
        check('id').exists().isMongoId(),
      ];
    }
    case exports.createFeedback.name: {
      return [
        check('title').optional(),
        check('location').exists().isArray(),
        check('author').exists().isString().not()
          .isEmpty(),
        check('address').exists().isString().not()
          .isEmpty(),
        check('type').exists().isArray(),
        check('password').optional({ nullable: true }).isString().isLength({ min: 8 }),
        check('description').optional(),
      ];
    }
    case exports.approveFeedback.name: {
      return [
        check('type').exists().isNumeric(),
        check('id').exists().isMongoId(),
        check('location').exists().isArray(),
        check('author').exists().isString(),
        check('address').exists().isString().not()
          .isEmpty(),
        check('password').optional({ nullable: true }).isString().isLength({ min: 8 }),
        check('description').optional(),
      ];
    }
    case exports.updateFeedback.name: {
      return [
        check('id').exists().isMongoId(),
        check('location').exists().isArray(),
        check('author').exists().isString().not()
          .isEmpty(),
        check('address').exists().isString().not()
          .isEmpty(),
        check('type').exists().isArray(),
      ];
    }
    case exports.deleteFeedback.name: {
      return [
        check('id').exists().isMongoId(),
      ];
    }
    case exports.deleteManyFeedback.name: {
      return [
        check('ids').exists().isArray(),
      ];
    }

    default: {
      return [];
    }
  }
};
