(function() {
  var Child, Comment, ImageUploader, InfoSection, User, fs, _, _s,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  User = require('../models/user');

  Comment = require('../models/comment');

  Child = require('../models/child');

  InfoSection = require('../models/info_section');

  ImageUploader = require('../lib/image_uploader');

  fs = require('fs');

  _ = require('underscore');

  _s = require('underscore.string');

  module.exports = function(app) {
    app.get('/profiles', function(req, res) {
      var currentUser;
      currentUser = req.user ? req.user : {};
      return User.find().where("_id")["in"](currentUser.friends).asc('name', 'surname').run(function(err, users) {
        return res.render('profiles/profiles', {
          profiles: users,
          show_private: false,
          layout: false
        });
      });
    });
    app.get('/profiles/quick-search', function(req, res) {
      var currentUser, limit, q, searchSlug;
      currentUser = req.user ? req.user : {};
      q = req.query.q;
      limit = req.query.limit;
      searchSlug = new RegExp("^" + q + ".*$", "i");
      return User.find().or([
        {
          name: searchSlug
        }, {
          surname: searchSlug
        }
      ]).where("type")["in"](["daycare", "parent", "staff"]).limit(limit).asc('name', 'surname').run(function(err, users) {
        return res.render('profiles/quick_search', {
          layout: false,
          profiles: users,
          _: _
        });
      });
    });
    app.get('/daycares', function(req, res) {
      var addressComponents, city, query, stateCode, zipCode;
      addressComponents = req.query.address_components || {};
      city = addressComponents.city || false;
      stateCode = addressComponents.state_code || false;
      zipCode = addressComponents.zip_code || false;
      query = User.find({
        type: 'daycare'
      }).desc('name');
      if (city && stateCode) {
        city = _s.titleize(city);
        stateCode = stateCode.toUpperCase();
        query.where("location_components.city", city).where("location_components.state_code", stateCode);
      }
      if (zipCode) query.where("location_components.zip_code", zipCode);
      return query.run(function(err, daycares) {
        if (daycares == null) daycares = [];
        return res.render('profiles/profiles', {
          profiles: daycares,
          show_private: false,
          layout: false
        });
      });
    });
    app.get('/day-care/section/:section_name/:daycare_id', function(req, res) {
      var daycareId, sectionName;
      daycareId = req.params.daycare_id;
      sectionName = req.params.section_name.replace(/-/g, "_");
      return InfoSection.findOne({
        user_id: daycareId
      }).run(function(err, infoSection) {
        if (infoSection) {
          return res.json(infoSection[sectionName]);
        } else {
          return res.json({});
        }
      });
    });
    app.put('/day-care/section/:section_name/:daycare_id', function(req, res) {
      var data, daycareId, sectionName;
      daycareId = req.params.daycare_id;
      sectionName = req.params.section_name.replace(/-/g, "_");
      data = {};
      data[sectionName] = req.body;
      InfoSection.findOne({
        user_id: daycareId
      }).run(function(err, infoSection) {
        if (infoSection) {
          infoSection.set(data);
        } else {
          infoSection = new InfoSection(data);
          infoSection.user_id = daycareId;
        }
        return infoSection.save();
      });
      return res.json({
        success: true
      });
    });
    app.get('/profiles/me', function(req, res) {
      var currentUser;
      currentUser = req.user ? req.user : {};
      return User.findOne({
        _id: currentUser._id
      }).run(function(err, user) {
        if (user) {
          return user.findDaycareFriends(function() {
            return res.render('profiles/_user', {
              profile: user,
              show_private: true,
              layout: false
            });
          });
        } else {
          res.statusCode = 401;
          return res.json({
            "error": true
          });
        }
      });
    });
    app.post('/profiles', function(req, res) {
      var currentUser, data, profilePicturesSet, user;
      currentUser = req.user ? req.user : {};
      data = req.body;
      user = new User(data);
      user.master_id = currentUser._id;
      user.friends.push(currentUser._id);
      if (!user.picture_sets.length) {
        profilePicturesSet = {
          type: 'profile',
          name: 'Profile pictures',
          description: 'Your profile pictures.',
          pictures: []
        };
        user.picture_sets.push(profilePicturesSet);
      }
      return user.save(function(err, savedUser) {
        currentUser.friends.push(savedUser._id);
        return currentUser.save(function() {
          return res.json({
            success: true,
            _id: savedUser._id
          });
        });
      });
    });
    app.get('/profiles/:id', function(req, res) {
      return User.findOne({
        _id: req.params.id
      }).run(function(err, user) {
        var currentUser, showPrivate;
        currentUser = req.user ? req.user : {};
        showPrivate = currentUser._id === user._id;
        return res.render('profiles/profile', {
          profile: user,
          show_private: showPrivate,
          layout: false
        });
      });
    });
    app.put('/profiles/:id', function(req, res) {
      var currentUser, data;
      currentUser = req.user ? req.user : {};
      data = req.body;
      delete data._id;
      return User.update({
        _id: currentUser._id
      }, data, {}, function(err, user) {
        return res.json({
          success: true
        });
      });
    });
    app.get('/profiles/picture-set/:id', function(req, res) {
      var currentUser, pictureSetId;
      pictureSetId = req.params.id;
      currentUser = req.user ? req.user : {};
      return User.findOne({
        'picture_sets._id': pictureSetId
      }).run(function(err, user) {
        var pictureSet, showPrivate;
        pictureSet = user.picture_sets.id(pictureSetId);
        pictureSet.user_id = user._id;
        showPrivate = currentUser._id === user._id;
        return res.render('profiles/_picture_set', {
          picture_set: pictureSet,
          show_private: showPrivate,
          layout: false
        });
      });
    });
    app.put('/profiles/picture-set/:id', function(req, res) {
      var pictureSetId;
      pictureSetId = req.params.id;
      return User.findOne({
        'picture_sets._id': pictureSetId
      }).run(function(err, user) {
        var key, pictureSet, pictureSetIndexToEdit, value, _i, _len, _ref, _ref2;
        if (user) {
          pictureSetIndexToEdit = -1;
          _ref = user.picture_sets;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            pictureSet = _ref[_i];
            pictureSetIndexToEdit++;
            if (pictureSet._id + "" === pictureSetId + "") break;
          }
          delete req.body._id;
          _ref2 = req.body;
          for (key in _ref2) {
            value = _ref2[key];
            user.picture_sets[pictureSetIndexToEdit][key] = value;
          }
          user.save();
          return res.json({
            success: true
          });
        } else {
          return res.json({
            success: false
          });
        }
      });
    });
    app.del('/profiles/picture-set/:id', function(req, res) {
      var pictureSetId;
      pictureSetId = req.params.id;
      return User.findOne({
        'picture_sets._id': pictureSetId
      }).run(function(err, user) {
        var filePath, picture, pictureSet, _i, _len, _ref;
        if (user) {
          pictureSet = user.picture_sets.id(pictureSetId);
          pictureSet.remove();
          user.save();
          _ref = pictureSet.pictures;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            picture = _ref[_i];
            filePath = './public/' + picture.url;
            try {
              fs.unlinkSync(filePath);
            } catch (e) {
              console.error(e);
            }
          }
          filePath = './public/users/' + pictureSetId;
          try {
            fs.rmdirSync(filePath);
          } catch (e) {
            console.error(e);
          }
          return res.json({
            success: true
          });
        } else {
          return res.json({
            success: false
          });
        }
      });
    });
    app.get('/profiles/pictures/:pictureSetId', function(req, res) {
      var currentUser, pictureSetId;
      pictureSetId = req.params.pictureSetId;
      currentUser = req.user ? req.user : {};
      return User.findOne({
        'picture_sets._id': pictureSetId
      }).run(function(err, user) {
        var pictureSet, pictures, showPrivate;
        pictureSet = user.picture_sets.id(pictureSetId);
        pictures = pictureSet.pictures;
        showPrivate = currentUser._id === user._id;
        return res.render('profiles/pictures', {
          pictures: pictures,
          show_private: showPrivate,
          layout: false
        });
      });
    });
    app.del('/profiles/picture/:pictureId', function(req, res) {
      var pictureId;
      pictureId = req.params.pictureId;
      return User.findOne({
        'picture_sets.pictures._id': pictureId
      }).run(function(err, user) {
        var bigFilePath, filePath, mediumFilePath, miniFilePath, picture, pictureIndex, pictureIndexToGo, pictureSet, pictureSetIndex, pictureSetIndexToGo, pictureToRemove, smallFilePath, thumbFilePath, tinyFilePath, _i, _j, _len, _len2, _ref, _ref2;
        if (user) {
          pictureSetIndex = -1;
          pictureIndex = -1;
          pictureSetIndexToGo = -1;
          pictureIndexToGo = -1;
          _ref = user.picture_sets;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            pictureSet = _ref[_i];
            pictureSetIndex++;
            pictureIndex = -1;
            _ref2 = pictureSet.pictures;
            for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
              picture = _ref2[_j];
              pictureIndex++;
              if (("" + picture._id) === ("" + pictureId)) {
                pictureSetIndexToGo = pictureSetIndex;
                pictureIndexToGo = pictureIndex;
                break;
              }
            }
          }
          pictureToRemove = user.picture_sets[pictureSetIndexToGo].pictures[pictureIndexToGo];
          filePath = './public/' + pictureToRemove.url;
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            console.error(e);
          }
          tinyFilePath = './public/' + pictureToRemove.tiny_url;
          try {
            fs.unlinkSync(tinyFilePath);
          } catch (e) {
            console.error(e);
          }
          miniFilePath = './public/' + pictureToRemove.mini_url;
          try {
            fs.unlinkSync(miniFilePath);
          } catch (e) {
            console.error(e);
          }
          smallFilePath = './public/' + pictureToRemove.small_url;
          try {
            fs.unlinkSync(smallFilePath);
          } catch (e) {
            console.error(e);
          }
          thumbFilePath = './public/' + pictureToRemove.thumb_url;
          try {
            fs.unlinkSync(thumbFilePath);
          } catch (e) {
            console.error(e);
          }
          mediumFilePath = './public/' + pictureToRemove.medium_url;
          try {
            fs.unlinkSync(mediumFilePath);
          } catch (e) {
            console.error(e);
          }
          bigFilePath = './public/' + pictureToRemove.big_url;
          try {
            fs.unlinkSync(bigFilePath);
          } catch (e) {
            console.error(e);
          }
          user.picture_sets[pictureSetIndexToGo].pictures[pictureIndexToGo].remove();
          user.save();
          Comment.find({
            "content.type": "new_picture",
            "content.picture_set_id": user.picture_sets[pictureSetIndexToGo]._id
          }).run(function(err, comments) {
            var comment, pictures, _k, _len3, _results;
            if (comments == null) comments = [];
            if (comments.length) {
              _results = [];
              for (_k = 0, _len3 = comments.length; _k < _len3; _k++) {
                comment = comments[_k];
                pictures = _.filter(comment.content.pictures, function(picture) {
                  return ("" + picture._id) !== ("" + pictureId);
                });
                if (pictures.length) {
                  _results.push(Comment.update({
                    _id: comment._id
                  }, {
                    "content.pictures": pictures
                  }).run(function() {}));
                } else {
                  _results.push(comment.remove());
                }
              }
              return _results;
            }
          });
          return res.json({
            success: true
          });
        } else {
          return res.json({
            success: false
          });
        }
      });
    });
    app.put('/profiles/picture/:pictureId', function(req, res) {
      var pictureId;
      pictureId = req.params.pictureId;
      return User.findOne({
        'picture_sets.pictures._id': pictureId
      }).run(function(err, user) {
        var key, picture, pictureIndex, pictureIndexToGo, pictureSet, pictureSetIndex, pictureSetIndexToGo, value, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3, _ref4;
        if (user) {
          pictureSetIndex = -1;
          pictureIndex = -1;
          pictureSetIndexToGo = -1;
          pictureIndexToGo = -1;
          _ref = user.picture_sets;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            pictureSet = _ref[_i];
            pictureSetIndex++;
            pictureIndex = -1;
            _ref2 = pictureSet.pictures;
            for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
              picture = _ref2[_j];
              pictureIndex++;
              if (("" + picture._id) === ("" + pictureId)) {
                pictureSetIndexToGo = pictureSetIndex;
                pictureIndexToGo = pictureIndex;
                break;
              }
            }
          }
          _ref3 = user.picture_sets[pictureSetIndexToGo].pictures;
          for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
            picture = _ref3[_k];
            picture.primary = false;
          }
          delete req.body._id;
          _ref4 = req.body;
          for (key in _ref4) {
            value = _ref4[key];
            user.picture_sets[pictureSetIndexToGo].pictures[pictureIndexToGo][key] = value;
          }
          user.save();
          return res.json({
            success: true
          });
        } else {
          return res.json({
            success: false
          });
        }
      });
    });
    app.post('/profiles/upload', function(req, res) {
      var currentUser, description, dirPath, fileName, filePath, filePaths, imageUploader, newPicture, newPictureData, pictureSetId, relativeFilePaths, ws;
      currentUser = req.user ? req.user : {};
      pictureSetId = req.query.setId;
      fileName = req.query.qqfile;
      description = req.query.description;
      imageUploader = new ImageUploader;
      imageUploader.pictureSetId = pictureSetId;
      imageUploader.baseName = new Date().getTime();
      imageUploader.setExtensionFromFilename(fileName);
      dirPath = imageUploader.getDirPath();
      filePath = imageUploader.getFilePath();
      filePaths = imageUploader.getFilePaths();
      relativeFilePaths = imageUploader.getFilePaths(true);
      newPictureData = relativeFilePaths;
      newPictureData.description = description;
      newPicture = null;
      if (req.xhr) {
        try {
          fs.statSync(dirPath);
        } catch (e) {
          fs.mkdirSync(dirPath, 0777);
        }
        ws = fs.createWriteStream(filePath);
        try {
          fs.chmodSync(filePath, 777);
        } catch (e) {

        }
        req.on('data', function(data) {
          return ws.write(data);
        });
        return req.on('end', function() {
          return User.findOne({
            'picture_sets._id': pictureSetId
          }).run(function(err, user) {
            var newPicturePosition, pictureSet, pictureSetIndex, pictureSets, _i, _len;
            if (user) {
              pictureSets = user.picture_sets;
              newPicturePosition = null;
              pictureSetIndex = -1;
              for (_i = 0, _len = pictureSets.length; _i < _len; _i++) {
                pictureSet = pictureSets[_i];
                pictureSetIndex++;
                if ("" + pictureSet._id === "" + pictureSetId) {
                  if (!pictureSet.pictures.length) newPictureData.primary = true;
                  newPicturePosition = pictureSet.pictures.push(newPictureData);
                  break;
                }
              }
              user.picture_sets = pictureSets;
              user.save();
              newPicture = user.picture_sets[pictureSetIndex].pictures[newPicturePosition - 1];
              newPicture.success = true;
              return imageUploader.resizeAll(function() {
                var commentData;
                commentData = {
                  from_id: currentUser._id,
                  to_id: user._id,
                  wall_id: user._id
                };
                Comment.addNewPictureStatus(commentData, user.picture_sets[pictureSetIndex], newPicture);
                return res.json(newPicture);
              });
            } else {
              return res.json({
                success: false
              });
            }
          });
        });
      } else {
        if (req.files && req.files.qqfile) {
          try {
            fs.statSync(dirPath);
          } catch (e) {
            fs.mkdirSync(dirPath, 0777);
          }
          try {
            fs.writeFileSync(filePath, fs.readFileSync(req.files.qqfile.path));
          } catch (e) {
            console.log(e);
          }
          try {
            fs.chmodSync(filePath, 777);
          } catch (e) {

          }
          return User.findOne({
            'picture_sets._id': pictureSetId
          }).run(function(err, user) {
            var newPicturePosition, pictureSet, pictureSetIndex, pictureSets, _i, _len;
            if (user) {
              pictureSets = user.picture_sets;
              newPicturePosition = null;
              pictureSetIndex = -1;
              for (_i = 0, _len = pictureSets.length; _i < _len; _i++) {
                pictureSet = pictureSets[_i];
                pictureSetIndex++;
                if ("" + pictureSet._id === "" + pictureSetId) {
                  if (!pictureSet.pictures.length) newPictureData.primary = true;
                  newPicturePosition = pictureSet.pictures.push(newPictureData);
                  break;
                }
              }
              user.picture_sets = pictureSets;
              user.save();
              newPicture = user.picture_sets[pictureSetIndex].pictures[newPicturePosition - 1];
              newPicture.success = true;
              return imageUploader.resizeAll(function() {
                var commentData;
                commentData = {
                  from_id: currentUser._id,
                  to_id: user._id,
                  wall_id: user._id
                };
                Comment.addNewPictureStatus(commentData, user.picture_sets[pictureSetIndex], newPicture);
                return res.send(JSON.stringify(newPicture));
              });
            } else {
              return res.send('{"success": false}');
            }
          });
        } else {
          return res.send('{"success": false}');
        }
      }
    });
    app.get('/children/:user_id', function(req, res) {
      var userId;
      userId = req.params.user_id;
      return User.findOne({
        _id: userId
      }).run(function(err, user) {
        if (user.type === "class") {
          return Child.find({
            user_id: userId
          }).run(function(err, children) {
            return res.render('children/children', {
              children: children,
              layout: false
            });
          });
        } else if (user.type === "parent") {
          return Child.find().where("_id")["in"](user.children_ids).run(function(err, children) {
            return res.render('children/children', {
              children: children,
              layout: false
            });
          });
        } else {
          return User.find({
            master_id: userId
          }).run(function(err, classes) {
            var classesIds, daycareClass, _i, _len;
            classesIds = [];
            for (_i = 0, _len = classes.length; _i < _len; _i++) {
              daycareClass = classes[_i];
              classesIds.push(daycareClass._id);
            }
            return Child.find().where("user_id")["in"](classesIds).run(function(err, children) {
              return res.render('children/children', {
                children: children,
                layout: false
              });
            });
          });
        }
      });
    });
    app.post('/child', function(req, res) {
      var child, currentUser, data;
      currentUser = req.user ? req.user : {};
      data = req.body;
      child = new Child(data);
      return child.save(function() {
        return User.findOne({
          _id: child.user_id
        }).run(function(err, daycareClass) {
          daycareClass.children_ids.push(child._id);
          daycareClass.children_ids = _.uniq(daycareClass.children_ids);
          return daycareClass.save(function() {
            return res.json({
              success: true
            });
          });
        });
      });
    });
    app.put('/child/:id', function(req, res) {
      var childId, currentUser, data;
      childId = req.params.id;
      currentUser = req.user ? req.user : {};
      data = req.body;
      delete data._id;
      return Child.update({
        _id: childId
      }, data, {}, function(err, child) {
        return res.json({
          success: true
        });
      });
    });
    app.del('/child/:id', function(req, res) {
      var childId, currentUser;
      childId = req.params.id;
      currentUser = req.user ? req.user : {};
      return Child.findOne({
        _id: childId
      }).run(function(err, child) {
        return User.findOne({
          _id: child.user_id
        }).run(function(err, daycareClass) {
          daycareClass.children_ids = _.filter(daycareClass.children_ids, function(id) {
            return id !== childId;
          });
          return daycareClass.save(function() {
            return child.remove(function(err) {
              return res.json({
                success: true
              });
            });
          });
        });
      });
    });
    app.get('/classes/:master_id', function(req, res) {
      var masterId;
      masterId = req.params.master_id;
      return User.find({
        master_id: masterId
      }).run(function(err, classes) {
        if (classes == null) classes = [];
        return res.render('profiles/profiles', {
          profiles: classes,
          layout: false
        });
      });
    });
    app.get('/parents/:daycare_id', function(req, res) {
      var currentUser, daycareId;
      daycareId = req.params.daycare_id;
      currentUser = req.user ? req.user : {};
      if (("" + daycareId) === ("" + currentUser._id) || __indexOf.call(currentUser.friends, daycareId) >= 0) {
        return User.findOne({
          _id: daycareId
        }).run(function(err, dayCare) {
          return User.find({
            type: "parent"
          }).where("_id")["in"](dayCare.friends).run(function(err, parents) {
            var parent, parentIds, _i, _len;
            parentIds = [];
            for (_i = 0, _len = parents.length; _i < _len; _i++) {
              parent = parents[_i];
              parentIds = _.union(parentIds, parent.children_ids);
            }
            return Child.find().where("_id")["in"](parentIds).run(function(err, children) {
              var child, parent, _j, _k, _len2, _len3, _ref;
              for (_j = 0, _len2 = parents.length; _j < _len2; _j++) {
                parent = parents[_j];
                for (_k = 0, _len3 = children.length; _k < _len3; _k++) {
                  child = children[_k];
                  if (_ref = child._id, __indexOf.call(parent.children_ids, _ref) >= 0) {
                    parent.children.push(child);
                  }
                }
              }
              return res.render('profiles/profiles', {
                profiles: parents,
                layout: false
              });
            });
          });
        });
      } else {
        return res.render('profiles/profiles', {
          profiles: [],
          layout: false
        });
      }
    });
    app.get('/staff/:daycare_id', function(req, res) {
      var daycareId;
      daycareId = req.params.daycare_id;
      return User.findOne({
        _id: daycareId
      }).run(function(err, dayCare) {
        return User.find({
          type: "staff"
        }).where("_id")["in"](dayCare.friends).run(function(err, staff) {
          return res.render('profiles/profiles', {
            profiles: staff,
            layout: false
          });
        });
      });
    });
    return app.put('/staff/:id', function(req, res) {
      var currentUser, data, id;
      currentUser = req.user ? req.user : {};
      id = req.params.id;
      data = req.body;
      delete data._id;
      delete data.email;
      if ((__indexOf.call(currentUser.friends, id) >= 0 && currentUser.type === "daycare") || (id === currentUser._id)) {
        User.update({
          _id: id
        }, data, {}, function(err, user) {});
        return res.json({
          success: true
        });
      }
    });
  };

}).call(this);
