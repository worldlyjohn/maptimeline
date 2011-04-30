/** 
 * @fileoverview Very lightweight debugger
 *
 * This is a nice debugger that works in both IE and Firefox using the firebug console or another browser window
 * The console is only available to Firefox browsers with the firebug extension installed.
 *
 * @author John Brennan <john@janisb.com>
 * @version 0.8
 */

// -----------------------------------------------------------------
// allows writing to Firebug
// -----------------------------------------------------------------
function _DEBUG() {
    // The display type
    this.DEBUG_LEVEL = {production:0, log:1, debug:2, warn:3, error:4};

    // -----------------------------------------------------------------
    // EDITABLE CONFIG VARS
    this.turnOn = false;                             // turn all debug output on/off
    this.debugLevel = this.DEBUG_LEVEL.debug;       // level of debug output
    this.useConsoleWriter = true;                   // True to use Firebug console, False to use separate win (IE auto set to False)
    // -----------------------------------------------------------------
    
    
    
    // -----------------------------------------------------------------
    // config vars (do not change!)
    this._textOnScreen = false;
    this._consoleRef = null;
    this._linebreak = '\n';
    
    // For IE
    var isIE = false;
    var an = navigator.appName.toLowerCase();
    if(an.indexOf("microsoft") >= 0){
    	isIE = true;
        this.useConsoleWriter = false;
    }
    
    // setup browser window console
    if (this.turnOn && !this.useConsoleWriter){
        this._consoleRef = window.open('','debug_console','width=600,height=230,resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no');
        //this._consoleRef.document.open("text/html","replace");
        this._consoleRef.document.writeln('<html><head><title>Console</title></head><body bgcolor=white><div style="text-align:center"><input type="button" onclick="document.getElementById(\'writing_space\').innerHTML=\'\'; return false;" value="clear" /></div><div id="writing_space"></div></body></html>');
        this._consoleRef.document.close();
        
        // set linebreak for browser window
        this._linebreak = '<br/>\n';
    }
};
_DEBUG.prototype.log = function(str){
    if (this.turnOn && this.debugLevel > 0 && this.debugLevel <= 1) this._writer(this.DEBUG_LEVEL.log, str);
};
_DEBUG.prototype.debug = function(str){
    if (this.turnOn && this.debugLevel > 0 && this.debugLevel <= 2) this._writer(this.DEBUG_LEVEL.debug, str);
};
_DEBUG.prototype.vardump = function(name, obj){
    if (this.turnOn && this.debugLevel > 0 && this.debugLevel <= 2){
        str = this._linebreak + 'OBJECT DUMP for ' + name + '---------------------' + this._linebreak;
        for (var i in obj){
            try{
                str += '....' + i + ' = ' + obj[i] + this._linebreak;
            }catch(e){}
        }
        this._writer(this.DEBUG_LEVEL.debug, str);
    }
};
_DEBUG.prototype.warn = function(str){
    if (this.turnOn && this.debugLevel > 0 && this.debugLevel <= 3) this._writer(this.DEBUG_LEVEL.warn, str);
};
_DEBUG.prototype.error = function(str){
    if (this.turnOn && this.debugLevel > 0 && this.debugLevel <= 4) this._writer(this.DEBUG_LEVEL.error, str);
};
_DEBUG.prototype._writer = function(level, str){
    if (!this.useConsoleWriter){
        var line = this._consoleRef.document.createElement("div");
        
        switch(level){
            case this.DEBUG_LEVEL.error:
                line.style.backgroundColor = '#bb0000';
                line.style.color = '#ffffff';
                line.innerHTML = '{ERROR:} ' + str;
                break;
            case this.DEBUG_LEVEL.warn:
                line.style.backgroundColor = '#555555';
                line.style.color = '#ffffff';
                line.innerHTML = '{WARNING:} ' + str;
                break;
            default:
                line.innerHTML = str;
        }
        this._consoleRef.document.getElementById("writing_space").appendChild(line);
    }
    else{
        try{
            switch(level){
                case this.DEBUG_LEVEL.error:
                    console.error(str);
                    break;
                case this.DEBUG_LEVEL.warn:
                    console.warn(str);
                    break;
                default:
                    console.debug(str);
            }
        }
        catch(e){
            // no console defined
        }
    }
};
DEBUG = new _DEBUG();

