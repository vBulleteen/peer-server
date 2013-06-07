// Generated by CoffeeScript 1.6.2
(function() {
  'Tracks user-uploaded files, and their edit/production state.';
  var _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  window.ServerFileCollection = (function(_super) {
    __extends(ServerFileCollection, _super);

    function ServerFileCollection() {
      this.forEachDevelopmentFile = __bind(this.forEachDevelopmentFile, this);
      this.createProductionVersion = __bind(this.createProductionVersion, this);
      this.getContents = __bind(this.getContents, this);
      this.getFileType = __bind(this.getFileType, this);
      this.hasProductionFile = __bind(this.hasProductionFile, this);
      this.get404Page = __bind(this.get404Page, this);
      this.comparator = __bind(this.comparator, this);
      this.checkForNoFiles = __bind(this.checkForNoFiles, this);
      this.filenameAndExtension = __bind(this.filenameAndExtension, this);
      this.isFilenameInUse = __bind(this.isFilenameInUse, this);
      this.overwriteRequiredPages = __bind(this.overwriteRequiredPages, this);
      this.onServerFileAdded = __bind(this.onServerFileAdded, this);
      this.initLocalStorage = __bind(this.initLocalStorage, this);      _ref = ServerFileCollection.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ServerFileCollection.prototype.model = ServerFile;

    ServerFileCollection.prototype.initialize = function() {
      return this.on("add", this.onServerFileAdded);
    };

    ServerFileCollection.prototype.initLocalStorage = function(namespace) {
      this.localStorage = new Backbone.LocalStorage(namespace + "-ServerFileCollection");
      this.fetch({
        success: this.checkForNoFiles
      });
      return this.on("reset", this.checkForNoFiles);
    };

    ServerFileCollection.prototype.onServerFileAdded = function(serverFile) {
      var filenameAndExtension, index, newName, numToAppend, serverFilesWithName, _results;

      if (this.overwriteRequiredPages(serverFile)) {
        return;
      }
      serverFilesWithName = this.filter(function(otherServerFile) {
        return serverFile.get("name") === otherServerFile.get("name") && !serverFile.get("isProductionVersion") && !otherServerFile.get("isProductionVersion");
      });
      _.sortBy(serverFilesWithName, function(otherServerFile) {
        return otherServerFile.get("dateCreated");
      });
      numToAppend = 1;
      index = 1;
      _results = [];
      while (index < serverFilesWithName.length) {
        filenameAndExtension = this.filenameAndExtension(serverFile.get("name"));
        newName = filenameAndExtension.filename + "-" + numToAppend + filenameAndExtension.ext;
        if (!this.isFilenameInUse(newName)) {
          serverFile.save("name", newName);
          index++;
        }
        _results.push(numToAppend++);
      }
      return _results;
    };

    ServerFileCollection.prototype.overwriteRequiredPages = function(serverFile) {
      var didOverwrite,
        _this = this;

      didOverwrite = false;
      _.each(["index.html", "404.html"], function(pageName) {
        var defaultPage, serverFilesWithName;

        if (pageName === "index.html") {
          defaultPage = _this.indexTemplate;
        } else {
          defaultPage = _this.template404;
        }
        if (serverFile.get("name") === pageName && !serverFile.get("isProductionVersion")) {
          serverFilesWithName = _this.filter(function(otherServerFile) {
            return serverFile.get("name") === otherServerFile.get("name") && !serverFile.get("isProductionVersion") && !otherServerFile.get("isProductionVersion") && serverFile !== otherServerFile && otherServerFile.get("contents") === defaultPage;
          });
          return _.each(serverFilesWithName, function(serverFileWithName) {
            serverFileWithName.destroy();
            serverFile.set("isRequired", true);
            return didOverwrite = true;
          });
        }
      });
      return didOverwrite;
    };

    ServerFileCollection.prototype.isFilenameInUse = function(filename) {
      var result;

      result = this.find(function(serverFile) {
        return serverFile.get("name") === filename && !serverFile.get("isProductionVersion");
      });
      return result !== void 0;
    };

    ServerFileCollection.prototype.filenameAndExtension = function(filename) {
      var match;

      match = filename.match(/(.*)(\..*)$/);
      if (match !== null && match.length === 3) {
        return {
          filename: match[1],
          ext: match[2]
        };
      }
      return {
        filename: filename,
        ext: ""
      };
    };

    ServerFileCollection.prototype.checkForNoFiles = function() {
      var index, notFound;

      if (this.length > 0) {
        return;
      }
      console.log("loading stuff");
      index = new ServerFile({
        name: "index.html",
        size: 0,
        type: "text/html",
        contents: this.indexTemplate,
        isRequired: true
      });
      notFound = new ServerFile({
        name: "404.html",
        size: 0,
        type: "text/html",
        contents: this.template404,
        isRequired: true
      });
      this.add(index);
      this.add(notFound);
      index.save();
      notFound.save();
      return this.createProductionVersion();
    };

    ServerFileCollection.prototype.comparator = function(serverFile) {
      var filenameAndExtension;

      filenameAndExtension = this.filenameAndExtension(serverFile.get("name"));
      return filenameAndExtension.filename;
    };

    ServerFileCollection.prototype.getLandingPage = function() {
      var data, landingPage;

      landingPage = this.find(function(serverFile) {
        return serverFile.get("name") === "index.html" && serverFile.get("isProductionVersion");
      });
      if (landingPage) {
        data = {
          fileContents: landingPage.get("contents"),
          filename: landingPage.get("name"),
          type: "text/html"
        };
      } else {
        console.error("ERROR: No index.html file exists in the file collection, may break when trying to use getters.");
        data = {
          fileContents: this.indexTemplate,
          filename: "index.html",
          type: "text/html"
        };
      }
      return data;
    };

    ServerFileCollection.prototype.get404Page = function() {
      var data, page;

      page = this.find(function(serverFile) {
        return serverFile.get("name") === "404.html" && serverFile.get("isProductionVersion");
      });
      console.log("Returning 404 page.");
      if (page) {
        data = {
          fileContents: page.get("contents"),
          filename: page.get("name"),
          type: page.get("fileType")
        };
      } else {
        console.error("ERROR: No 404 file exists in the file collection, may break when trying to use getters.");
        data = {
          fileContents: this.template404,
          filename: "404.html",
          type: "HTML"
        };
      }
      return data;
    };

    ServerFileCollection.prototype.hasProductionFile = function(filename) {
      return this.findWhere({
        name: filename,
        isProductionVersion: true
      });
    };

    ServerFileCollection.prototype.getFileType = function(filename) {
      var fileType, serverFile;

      serverFile = this.findWhere({
        name: filename,
        isProductionVersion: true
      });
      fileType = "UNKNOWN";
      if (serverFile) {
        fileType = serverFile.get("fileType");
      }
      return fileType;
    };

    ServerFileCollection.prototype.getContents = function(filename) {
      var contents, serverFile;

      serverFile = this.findWhere({
        name: filename,
        isProductionVersion: true
      });
      contents = "";
      if (serverFile) {
        contents = serverFile.get("contents");
      }
      return contents;
    };

    ServerFileCollection.prototype.createProductionVersion = function() {
      var developmentFiles, productionFiles,
        _this = this;

      productionFiles = this.where({
        isProductionVersion: true
      });
      _.each(productionFiles, function(serverFile) {
        return serverFile.destroy();
      });
      developmentFiles = this.where({
        isProductionVersion: false
      });
      return _.each(developmentFiles, function(serverFile) {
        var attrs, copy;

        attrs = _.clone(serverFile.attributes);
        attrs.id = null;
        copy = new ServerFile(attrs);
        copy.set("isProductionVersion", true);
        _this.add(copy);
        return copy.save();
      });
    };

    ServerFileCollection.prototype.forEachDevelopmentFile = function(fn) {
      return this.each(function(serverFile) {
        if (!serverFile.get("isProductionVersion")) {
          return fn(serverFile);
        }
      });
    };

    ServerFileCollection.prototype.indexTemplate = "<html>\n  <body>\n    Hello, world.\n  </body>\n</html>";

    ServerFileCollection.prototype.template404 = "<html>\n  <body>\n    404 - page not found\n  </body>\n</html>";

    return ServerFileCollection;

  })(Backbone.Collection);

}).call(this);
