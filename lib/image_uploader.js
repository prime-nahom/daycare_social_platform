(function() {
  var ImageUploader, exports, im, path;

  path = require("path");

  im = require("imagemagick");

  ImageUploader = (function() {

    function ImageUploader() {}

    ImageUploader.prototype.rootPath = "./public/users/";

    ImageUploader.prototype.relativeRootPath = "/users/";

    ImageUploader.prototype.baseName = null;

    ImageUploader.prototype.extName = null;

    ImageUploader.prototype.pictureSetId = null;

    ImageUploader.prototype.resizeFilters = {
      tiny: {
        width: 30,
        height: 30,
        method: "crop"
      },
      mini: {
        width: 50,
        height: 50,
        method: "crop"
      },
      small: {
        width: 110,
        height: 110,
        method: "crop"
      },
      thumb: {
        width: 150,
        height: 150,
        method: "crop"
      },
      medium: {
        width: 568,
        height: 393,
        method: "crop"
      },
      big: {
        width: 800,
        height: 600,
        method: "resize"
      }
    };

    ImageUploader.prototype.itemProcessing = 0;

    ImageUploader.prototype.getDirPath = function(relative) {
      if (relative == null) relative = false;
      if (relative) {
        return "" + this.relativeRootPath + this.pictureSetId + "/";
      } else {
        return "" + this.rootPath + this.pictureSetId + "/";
      }
    };

    ImageUploader.prototype.getFilePath = function(relativePath) {
      var dirPath;
      if (relativePath == null) relativePath = false;
      dirPath = this.getDirPath(relativePath);
      return "" + dirPath + this.baseName + "." + this.extName;
    };

    ImageUploader.prototype.setExtensionFromFilename = function(fileName) {
      return this.extName = path.extname(fileName).replace(/^\./, "");
    };

    ImageUploader.prototype.getFilePaths = function(relativePath) {
      var dirPath, name, options, pictureData, _ref;
      if (relativePath == null) relativePath = false;
      dirPath = this.getDirPath(relativePath);
      pictureData = {
        url: "" + dirPath + this.baseName + "." + this.extName
      };
      _ref = this.resizeFilters;
      for (name in _ref) {
        options = _ref[name];
        pictureData["" + name + "_url"] = "" + dirPath + this.baseName + "_" + name + "." + this.extName;
      }
      return pictureData;
    };

    ImageUploader.prototype.resizeAll = function(onFinishCallback) {
      var filtersTotal, name, options, _ref, _results;
      filtersTotal = Object.keys(this.resizeFilters).length;
      _ref = this.resizeFilters;
      _results = [];
      for (name in _ref) {
        options = _ref[name];
        _results.push(this.resize(name, options, onFinishCallback));
      }
      return _results;
    };

    ImageUploader.prototype.resize = function(name, options, callback) {
      var filePath, filePaths,
        _this = this;
      filePath = this.getFilePath();
      filePaths = this.getFilePaths();
      this.itemProcessing++;
      return im[options.method]({
        srcPath: filePaths.url,
        dstPath: filePaths["" + name + "_url"],
        width: options.width,
        height: options.height,
        quality: 1
      }, function(err, stdout, stderr) {
        if (err) console.log(err);
        if (stderr) console.log(stderr);
        _this.itemProcessing--;
        if (typeof callback === "function" && _this.itemProcessing <= 0) {
          return callback(err, stdout, stderr);
        }
      });
    };

    return ImageUploader;

  })();

  exports = module.exports = ImageUploader;

}).call(this);
