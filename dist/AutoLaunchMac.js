var applescript, fileBasedUtilities, untildify,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

applescript = require('applescript');

untildify = require('untildify');

fileBasedUtilities = require('./fileBasedUtilities');

module.exports = {

  /* Public */
  enable: function(arg1) {
    var appName, appPath, arg, data, extraArgs, i, isHiddenOnLaunch, isHiddenValue, len, mac, programArguments, programArgumentsSection, properties;
    appName = arg1.appName, appPath = arg1.appPath, isHiddenOnLaunch = arg1.isHiddenOnLaunch, extraArgs = arg1.extraArgs, mac = arg1.mac;
    if (mac.useLaunchAgent) {
      programArguments = [appPath];
      if (isHiddenOnLaunch) {
        programArguments.push('--hidden');
      }
      if (extraArgs.length) {
        for (i = 0, len = extraArgs.length; i < len; i++) {
          arg = extraArgs[i];
          programArguments.push(arg);
        }
      }
      programArgumentsSection = programArguments.map(function(argument) {
        return "    <string>" + argument + "</string>";
      }).join('\n');
      data = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">\n<plist version=\"1.0\">\n<dict>\n  <key>Label</key>\n  <string>" + appName + "</string>\n  <key>ProgramArguments</key>\n  <array>\n  " + programArgumentsSection + "\n  </array>\n  <key>RunAtLoad</key>\n  <true/>\n</dict>\n</plist>";
      return fileBasedUtilities.createFile({
        data: data,
        directory: this.getDirectory(),
        filePath: this.getFilePath(appName)
      });
    }
    isHiddenValue = isHiddenOnLaunch ? 'true' : 'false';
    properties = "{path:\"" + appPath + "\", hidden:" + isHiddenValue + ", name:\"" + appName + "\"}";
    return this.execApplescriptCommand("make login item at end with properties " + properties);
  },
  disable: function(appName, mac) {
    if (mac.useLaunchAgent) {
      return fileBasedUtilities.removeFile(this.getFilePath(appName));
    }
    return this.execApplescriptCommand("delete login item \"" + appName + "\"");
  },
  isEnabled: function(appName, mac) {
    if (mac.useLaunchAgent) {
      return fileBasedUtilities.isEnabled(this.getFilePath(appName));
    }
    return this.execApplescriptCommand('get the name of every login item').then(function(loginItems) {
      return (loginItems != null) && indexOf.call(loginItems, appName) >= 0;
    });
  },

  /* Private */
  execApplescriptCommand: function(commandSuffix) {
    return new Promise(function(resolve, reject) {
      return applescript.execString("tell application \"System Events\" to " + commandSuffix, function(err, result) {
        if (err != null) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  },
  getDirectory: function() {
    return untildify('~/Library/LaunchAgents/');
  },
  getFilePath: function(appName) {
    return "" + (this.getDirectory()) + appName + ".plist";
  }
};
