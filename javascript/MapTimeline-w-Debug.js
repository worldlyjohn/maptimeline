/** 
 * @fileoverview
 * This class represents an object that gives a single
 * entry point to synchronize a {@link http://simile.mit.edu/timeline/docs/ Simile Timeline} and {@link http://dev.openlayers.org/releases/OpenLayers-2.7/doc/apidocs/files/OpenLayers/Map-js.html OpenLayersMap}.
 *
 * @author John Brennan <john@janisb.com>
 * @version 0.8 (2008/01/01)
 */
 
 
/**
 * Construct a new MapTimeline object.
 *
 * Usage:
 *       var mt = new MapTimeline();
 *       mt.initMap('map');
 *       mt.initTimeline('timeline');
 *
 * @class This MapTimeline class represents an object that gives a single
 * 			entry point to synchronize a {@link http://simile.mit.edu/timeline/docs/ Simile Timeline} and {@link http://dev.openlayers.org/releases/OpenLayers-2.7/doc/apidocs/files/OpenLayers/Map-js.html OpenLayersMap}.
 * @constructor
 * @param my_options see {@link MapTimeline#options}
 * @return A new MapTimeline object
 */
function MapTimeline(my_options) {
    // =================================================================
    // PUBLIC VARS
    // =================================================================
    
	/**
	 * A list of key/value pairs to customize object itself.  
	 *
	 *  Example: 
	 *       {
	 *           'zoom': 2,
	 *           'mapcenter': {'lat':27, 'lon':67},
	 *           'timecenter': new Date("February 10, 1952 12:00:00"),
	 *           'markerOff': {'url': 'http://www.yourdomain.com/image.png', 'width': 21, 'height': 25},
	 *           'markerOn': {'url': 'http://www.yourdomain.com/image-hover.png', 'width': 21, 'height': 25}
	 *       };
	 * @type {}
	 */
    this.options = {
        'zoom': null,
        'mapcenter': {'lat':0,'lon':0},
        'timecenter': new Date(),
        'markerOff': {'url': OpenLayers.Util.getImagesLocation()+"marker-blue.png", 'width': 21, 'height': 25},
        'markerOn': {'url': OpenLayers.Util.getImagesLocation()+"marker-gold.png", 'width': 21, 'height': 25}
    };
    
    
    // =================================================================
    // PRIVATE VARS
    // =================================================================
    
    // map vars
    var _map = null;
    var _mapLayers = {'main': null, 'georss': null, 'markers': null};
    var _timelineMarkers = new Array();
    var _nonTimelineMarkers = new Array();
    var _highlightMarkers = new Array();
    var _mapPopups = null;

    // timeline vars
    var _tl = null;
    var _eventSource = null;
    var _mainBandIdx = 0;

    // stores ref to resize timer    
    var resizeTimerID = null;
    
    // By convention, we make a private 'this' parameter.
    // This is used to make the object available to the private methods.
    // This is a workaround for an error in the ECMAScript Language Specification 
    // which causes this to be set incorrectly for inner functions.
    var this_ref = this;
    
    
    // =================================================================
    // PRIVATE FUNCTIONS
    // =================================================================
   
    /**
     * initialization constructor automatically called by instantiation
     *
     * @private
     */
   function _init(options){
        DEBUG.debug('MapTimeline:init');
        _setOptions(options);
        
        // event handlers    
        DEBUG.debug('MapTimeline:create:  adding event handlers');
        // old call by Prototype... if we want to put this func back we should use: SimileAjax.jQuery.fn.resize()
        //Event.observe(window, 'resize', _onResize.bindAsEventListener(this_ref), false);
    };
    
    /**
     * sets options to use for object by merging user defined options with default settings
     *
     * @private
     */
    function _setOptions(options){
        options = options || {};
        this_ref.options.zoom = parseInt(options.zoom) || this_ref.options.zoom;
        if (options.mapcenter){
            this_ref.options.mapcenter.lat = parseFloat(options.mapcenter.lat) || this_ref.options.mapcenter.lat;
            this_ref.options.mapcenter.lon = parseFloat(options.mapcenter.lon) || this_ref.options.mapcenter.lon;
        }
        this_ref.options.timecenter = options.timecenter || this_ref.options.timecenter;
        this_ref.options.markerOff = options.markerOff || this_ref.options.markerOff;
        this_ref.options.markerOn = options.markerOn || this_ref.options.markerOn;
    };
    
    /**
     * called by window's resize event
     *
     * @private
     */
    function _onResize(){
        if (resizeTimerID == null) {
            resizeTimerID = setTimeout(function() {
                DEBUG.log('MapTimeline:_onResize');
                resizeTimerID = null;
                _tl.layout();
            }, 500);
        }
    };
    
    
    // =================================================================
    // PUBLIC FUNCTIONS
    // =================================================================

    // map functions
    // -----------------------------------------------------------------
        
    /**
     * Initializes OpenLayers Map
     *
     * @param {String} div Id of an element in your page that will contain the map.
     * @param {Object} map_options (optional) OpenLayer.Map properties to add directly to the map.
     * @param {Object} cfg_options (optional) MapTimeline properties to use in this wrapper. You can override the WMS being used here. You can also toggle the marker layer here.
     *          var my_cfg_options = {
     *              'mainWMS': {
     *                  'title': 'OpenLayers WMS', 
     *                  'url': 'http://labs.metacarta.com/wms/vmap0', 
     *                  'options': {'layers':'basic'}
     *              },
     *              'markerLayer': {
     *                  'displayInLayerSwitcher': true
     *              }
     *          };
     * @see {@link http://dev.openlayers.org/releases/OpenLayers-2.7/doc/apidocs/files/OpenLayers/Map-js.html OpenLayers Documentation}
     */
    this.initMap = function(div, map_options, cfg_options){
        DEBUG.debug('MapTimeline:initMap');
        
        // init cfg options
        var default_cfg_options = {
            'mainWMS': {
                'title': 'OpenLayers WMS', 
                'url': 'http://labs.metacarta.com/wms/vmap0', 
                'options': {'layers':'basic'}
            },
            'markerLayer': {
                'displayInLayerSwitcher': false
            }
        };
        map_options = map_options || {maxResolution:'auto'};
        cfg_options = cfg_options || {};
        cfg_options.mainWMS = cfg_options.mainWMS || default_cfg_options.mainWMS;
        cfg_options.mainWMS.title = cfg_options.mainWMS.title || default_cfg_options.mainWMS.title;
        cfg_options.mainWMS.url = cfg_options.mainWMS.url || default_cfg_options.mainWMS.url;
        cfg_options.mainWMS.options = cfg_options.mainWMS.options || default_cfg_options.mainWMS.options;
        cfg_options.markerLayer = cfg_options.markerLayer || default_cfg_options.markerLayer;
        cfg_options.markerLayer.displayInLayerSwitcher = cfg_options.markerLayer.displayInLayerSwitcher || default_cfg_options.markerLayer.displayInLayerSwitcher;
        
    
        _map = new OpenLayers.Map(div, map_options);
        
        //
        // Add default map layers
        // all layers added to <_mapLayers> can be accessed by other methods
        //
    
        // add main WMS layer
        _mapLayers.main = new OpenLayers.Layer.WMS(cfg_options.mainWMS.title, cfg_options.mainWMS.url, cfg_options.mainWMS.options); 
        
        // add markers layer    
        _mapLayers.markers = new OpenLayers.Layer.Markers("Markers", {displayInLayerSwitcher: cfg_options.markerLayer.displayInLayerSwitcher});
        
        // add all layers so far
        _map.addLayers([_mapLayers.main, _mapLayers.markers]);
            
                
        //
        // Set map center
        //
        
        if (this.options.mapcenter.lon != null && this.options.mapcenter.lat != null){
            if (this.options.zoom != null)
                this.setMapCenter(this.options.mapcenter.lat, this.options.mapcenter.lon, this.options.zoom);
            else
                this.setMapCenter(this.options.mapcenter.lat, this.options.mapcenter.lon);
        }
        else{
            _map.zoomToMaxExtent();
        }
    };
    
    /**
     * Adds a listener to the map when an event is clicked
     *
     * @ignore
     * @param listener Function to be fired
     */
    this.addOnSelectListenerToMap = function(listener){
        DEBUG.warn('MapTimeline:addOnSelectListener:  add listen to Map - not yet implemented');
    };
    
    /**
     * Adds a listener to the map when event(s) are added
     *
     * @ignore
     * @param listener Function to be fired
     */
    this.addOnAddListenerToMap = function(listener){
        DEBUG.warn('MapTimeline:addOnAddListenerToMap:  add listen to Map - not yet implemented');
    };
    
    /**
     * Sets map center and optional zoom
     *
     * @param lat Integer
     * @param lon Integer
     * @param zoom Integer (optional)
     */
    this.setMapCenter = function(lat, lon, zoom){
        lat = lat || 0;
        lon = lon || 0;
        zoom = zoom || null;
        
        if (lon != null && lat != null){
            DEBUG.debug('MapTimeline:setMapCenter:  lon='+lon+', lat='+lat+', zoom='+zoom);
            _map.setCenter(new OpenLayers.LonLat(lon, lat), zoom);
        }
        else{
            DEBUG.debug('MapTimeline:setMapCenter:  one or more values are null.  did not set.');
        }
    };
    
    /**
     * Returns current map center
     *
     * @return {OpenLayers.LonLat}
     */
    this.getMapCenter = function(){
        return _map.getCenter();
    };
        
    /**
     * Sets zoom level
     *
     * @param Integer i 
     */
    this.setZoom = function(i){
        _map.zoomTo(i);
    };
    
    /**
     * Returns current zoom level
     *
     * @return {Integer}
     */
    this.getZoom = function(){
        return _map.getZoom();
    };
    
    /**
     * Highlights the requested marker
     *
     * @param {MMarker} mmarker The marker to be highlighted
     */
    this.highlightMarker = function(mmarker){
        // clear any markers that were highlighted
        this.unHighlightMarkers();
        
        // highlight this marker
        mmarker.setMarkerIcon(this.options.markerOn.url, this.options.markerOn.width, this.options.markerOn.height);
        _highlightMarkers.push(mmarker);
    }
    
    /**
     * Un-highlights all markers
     */
    this.unHighlightMarkers = function(){
        // clear any markers that were highlighted
        for (var index = 0, len = _highlightMarkers.length; index < len; ++index) {
            this.unHighlightMarker(_highlightMarkers[index]);
        }
        
        _highlightMarkers = [];
    }
    
    /**
     * Un-highlights the requested marker
     *
     * @param {MMarker} mmarker The marker to be unhighlighted
     */
    this.unHighlightMarker = function(mmarker){
        // remove from highlights array before we change the obj
        _highlightMarkers = _highlightMarkers.splice(_highlightMarkers.indexOf(mmarker), 1);
        
        // revert marker back to original color
        mmarker.setMarkerIcon(this.options.markerOff.url, this.options.markerOff.width, this.options.markerOff.height);
    }
    
    /**
     * Displays the marker if it is not already displayed
     *
     * @param {MMarker} mmarker The marker to be displayed
     */
    this.showMarker = function(mmarker){
        DEBUG.debug('MapTimeline:showMarker:  entering...');
        if(!mmarker.isHidden()){
            return;
        }
    
        // show marker if hidden
        DEBUG.debug('MapTimeline:showMarker:  enabling marker (#'+ mmarker.getEvent().getID() +')');
        mmarker.show();
        
        // get marker ref
        marker = mmarker.getMarker();
        
        // add marker to layer
        _mapLayers.markers.addMarker(marker);
        
        // register mouse event
        DEBUG.debug('MapTimeline:showMarker:  registering event');
        mousedown = mmarker.getEventFunction();
        
        // 'this' gets lost in scopes, so let's make a reference to it
        this_ref = this;
        
        // an event handler can only take single argument, so let's wrap it so we can send additional arguments to the function
        var mousedown_wrapper = function(evt){ mousedown(evt, this_ref, mmarker); };
        
        // register with marker
        marker.events.register("mousedown", marker, mousedown_wrapper);

        if((mmarker.getFeatureVectors() != null) && (this.getGeoRSSLayer() != null)){
            _mapLayers.georss.addFeatures(mmarker.getFeatureVectors());
        }
    }
    
    /**
     * Displays an array of markers
     *
     * @param {MMarker []} mmarkers An array of markers to be displayed
     */
    this.showMarkers = function(mmarkers){
        for (var index = 0, len = mmarkers.length; index < len; ++index) {
            this.showMarker(mmarkers[index]);
        }
    }
    
    /**
     * Hides a marker if it is already displayed 
     *
     * @param {MMarker} mmarker The marker to be hidden
     */
    this.hideMarker = function(mmarker){
        if(mmarker.isHidden()){
            return;
        }
        mmarker.hide();
        if((mmarker.getFeatureVectors() != null) && (this.getGeoRSSLayer() != null)){
            _mapLayers.georss.removeFeatures(mmarker.getFeatureVectors());
        }
    }
    
    /**
     * Hides an array of markers
     *
     * @param {MMarker []} mmarkers Markers to be hidden 
     */
    this.hideMarkers = function(mmarkers){
        for (var index = 0, len = mmarkers.length; index < len; ++index) {
            this.hideMarker(mmarkers[index]);
        }
    }
    
    /**
     * Removes the marker from the layer and unregisters marker events
     *
     * @param {MMarker []} mmarkers Markers array
     * @param {MMarker} mmarker The marker to be removed
     */
    this.removeMarker = function(mmarkers, mmarker){
        mmarker.hide();
        
        // get marker ref
        marker = mmarker.getMarker();
        mousedown = mmarker.getEventFunction();
        
        // remove marker from layer
        _mapLayers.markers.removeMarker(marker);
        
        // unregister mouse event
        marker.events.unregister("mousedown", marker, mousedown);
        
        if((mmarker.getFeatureVectors() != null) && (this.getGeoRSSLayer() != null)){
            _mapLayers.georss.removeFeatures(mmarker.getFeatureVectors());
        }
        
        // remove marker from list
        mmarkers = mmarkers.splice(mmarkers.indexOf(mmarker), 1);
    }
    
    /**
     * Removes an array of markers
     *
     * @param {MMarker []} mmarkers Markers to be removed 
     */
    this.removeMarkers = function(mmarkers){
        if (mmarkers != null) {
            while(mmarkers.length > 0) {
                this.removeMarker(mmarkers, mmarkers[0]);
            }
        }
    }
    
    /**
     * Filters map markers using a filter function
     *
     * @param {Function} fn Filter function. Pass it an object with methods getDescription(), getText()
     */
    this.filterMarkers = function(filterFn){
        if (filterFn == null){
            // show all markers
            this.showMarkers(_timelineMarkers);
            this.showMarkers(_nonTimelineMarkers);
        }
        else{
            for(j = 0; j < _timelineMarkers.length; j++){
                if(filterFn(_timelineMarkers[j].tevt) == true){
                    this.showMarker(_timelineMarkers[j]);
                }
                else{
                    this.hideMarker(_timelineMarkers[j]);
                }
            }
            
            for(k = 0; k < _nonTimelineMarkers.length; k++){
                if(filterFn(_nonTimelineMarkers[k].tevt) == true){
                    this.showMarker(_nonTimelineMarkers[j]);
                }
                else{
                    this.hideMarker(_nonTimelineMarkers[j]);
                }
            }
        }
    };
    
    /**
     * Returns the main WMS layer for the map
     *
     * @return {OpenLayers.Layer.WMS} layer 
     */
    this.getMainWMSLayer = function(){
        return _mapLayers.main;
    };
    
    /**
     * Returns the marker layer for the map
     *
     * @return {OpenLayers.Layer.Markers} layer 
     */
    this.getMarkerLayer = function(){
        return _mapLayers.markers;
    };
    
    /**
     * Get a list of controls of a given class (CLASS_NAME)
     *
     * @param {OpenLayers.Control} control to add to map 
     * @returns {Array(OpenLayers.Control)} A list of controls matching the given class.  An empty array is returned if no matches are found.
     */
    this.getControlsByClass = function(match){
        return _map.getControlsByClass(match);
    };
    
    /**
     * Adds a control to the map
     *
     * @param {OpenLayers.Control} control to add to map 
     */
    this.addControl = function(control){
        _map.addControl(control);
    };
    
    /**
     * Removes a control from the map
     *
     * @param {OpenLayers.Control} control to remove from map 
     */
    this.removeControl = function(control){
        _map.removeControl(control);
    };
    
    /**
     * Removes a layer from the map
     *
     * @param {OpenLayers.Layer} layer 
     */
    this.addLayer = function(layer){
        _map.addLayer(layer);
    
        // move markers layer above all other layers
        _map.raiseLayer(_mapLayers.markers, 1);
        if (this.getGeoRSSLayer() != null){
            _map.raiseLayer(_mapLayers.georss, 1);
        }
    };
    
    /**
     * Removes a layer from the map
     *
     * @param {OpenLayers.Layer} layer 
     */
    this.removeLayer = function(layer){
        layer.destroy();
    };
  
    /**
     * Gets a layer from the map based on layer ID
     *
     * @param {String} A layer id
     * @returns {OpenLayers.Layer} The Layer with the corresponding id from the map’s layer collection, or null if not found.
     */
    this.getLayer = function(layer_id){
        return _map.getLayer(layer_id);
    };
    
    /**
     * Adds a WMS layer to the map
     *
     * @param {String} name
     * @param {String} url
     * @param {Object} options
     * @return {OpenLayers.Layer.WMS}
     */
    this.addWMSLayer = function(name, url, options){
        wms = new OpenLayers.Layer.WMS(name, url, options);
        _map.addLayer(wms);
    
        // move markers layer above all other layers
        if (this.getGeoRSSLayer() != null){
            _map.raiseLayer(_mapLayers.georss, 1);
        }
        _map.raiseLayer(_mapLayers.markers, 1);
        
        return wms;
    };
    
    /**
     * Removes a WMS layer from the map
     *
     * @param {OpenLayers.Layer.WMS} layer
     */
    this.removeWMSLayer = function(layer){
        this.removeLayer(layer);
    };
    
    
    // timeline functions
    // -----------------------------------------------------------------
    
    /**
     * Initializes Timeline
     * see {@link http://simile.mit.edu/timeline/docs/} for more options
     *
     * @param {String} div Id of an element in your page that will contain the map.
     * @param {Timeline.createBandInfo[]} bandInfos is an array of Timeline.createBandInfo objects
     * @param {Timeline.HORIZONTAL} orientation of the timeline (Timeline.HORIZONTAL | Timeline.VERTICAL)
     * @param {Timeline.DefaultEventSource} eventSrc an event source that provides events to be painted on this band, e.g., new Timeline.DefaultEventSource(). It can be null, which means the band is empty.
     * @param {Integer} bandIdx an index into bandInfos that we will associate event handlers with
     */
    this.initTimeline = function(div, bandInfos, orientation, eventSrc, bandIdx){
        DEBUG.debug('MapTimeline:initTimeline');
        
        // use given bands or define a default band to use
        if (bandInfos == null){
            eventSrc = new Timeline.DefaultEventSource(0);
            bandInfos = [
                Timeline.createBandInfo({
                    eventSource:    eventSrc,
                    width:          "70%", 
                    intervalUnit:   Timeline.DateTime.DAY, 
                    intervalPixels: 100
                }),
                Timeline.createBandInfo({
                    overview:       true,
                    eventSource:    eventSrc,
                    width:          "30%", 
                    intervalUnit:   Timeline.DateTime.MONTH, 
                    intervalPixels: 300
                })
            ];
            bandInfos[1].syncWith = 0;
            bandInfos[1].highlight = true;
        }
    
        // must define an event source to add events to the band
        // doc: http://simile.mit.edu/wiki/How_to_Create_Timelines
        _eventSource = eventSrc;
        
        // we will be adding event listeners to this band index
        // here we are attaching them to the first, or HOUR, band
        if (bandIdx == null){
            DEBUG.debug('MapTimeline:initTimeline no bandIdx given. using default.');
        }
        _mainBandIdx = bandIdx || 0;
        
        // now lets build the timeline
        _tl = Timeline.create(document.getElementById(div), bandInfos, orientation);
        
        // add listener to timeline so we can communicate that info to the map 
        var mapActionsOnTimelineClick = function(eventId){
            // get event from source 
            var evt = _eventSource.getEvent(eventId);
            
            //Search the global timelineMarkers to see if the evt is registered with the map
            var timeMarker = this.searchMarkersForEvent(evt, _timelineMarkers);
        
            //if the event is mapped, display it's marker
            if(timeMarker != null){
                // highlight the marker
                this.highlightMarker(timeMarker);
                    
                // center map on the marker
                var point = timeMarker.getPoint();
                this.setMapCenter(point.lat, point.lon);
            }
            else{
                // event is not associated with a map marker, so lets
                // remove all highlighted markers
                this.unHighlightMarkers();
            }
        }
        this.addOnSelectListenerToTimeline(mapActionsOnTimelineClick.bindAsEventListener(this));
        this.setTimeCenter(this_ref.options.timecenter);
    };
    
    /**
     * Adds a listener to the timeline when an event is clicked
     *
     * @param listener Function to be fired.  e.g.  function(evtID){}
     */
    this.addOnSelectListenerToTimeline = function(listener){
        // right now event listener is only added to main band
        _tl.getBand(_mainBandIdx).getEventPainter().addOnSelectListener(listener);
    };
    
    /**
     * Adds a listener to the timeline when event(s) are added
     *
     * @param listener Function to be fired.  (no params sent to func unless you use onAddOne instead of onAddMany)
     */
    this.addOnAddListenerToTimeline = function(listener){
        _tl.getBand(_mainBandIdx).getEventSource().addListener({onAddMany: listener.bindAsEventListener(this), onAddOne: listener.bindAsEventListener(this)});
    };
    
    /**
     * Sets timeline center
     *
     * @param {Date} date to center around
     */
    this.setTimeCenter = function(date){
        _tl.getBand(_mainBandIdx).setCenterVisibleDate(date);
    };
    
    /**
     * Gets timeline center
     *
     * @return {Date} current date center point
     */
    this.getTimeCenter = function(){
        var date = _tl.getBand(_mainBandIdx).getCenterVisibleDate();
        return date;
    };
    

    // -----------------------------------------------------------------
    // shared functions
    // -----------------------------------------------------------------
    
    /**
     * Adds a listener to the timeline and/or map when an event is clicked
     * (listen on map is not currently implemented)
     *
     * @param listener Function to be fired
     * @param addtoMap Bool whether we should add listener to map
     * @param addtoTL Bool whether we should add listener to timeline
     */
    this.addOnSelectListener = function(listener, addtoMap, addtoTL){
        if (addtoMap){
            this.addOnSelectListenerToMap(listener);
        }
        if (addtoTL){
            this.addOnSelectListenerToTimeline(listener);
        }
    };
    
    /**
     * Adds a listener to the timeline and/or map event(s) are added
     * (listen on map is not currently implemented)
     *
     * @param listener Function to be fired
     * @param addtoMap Bool whether we should add listener to map
     * @param addtoTL Bool whether we should add listener to timeline
     */
    this.addOnAddListener = function(listener, addtoMap, addtoTL){
        if (addtoMap){
            this.addOnSelectListenerToMap(listener);
        }
        if (addtoTL){
            this.addOnAddListenerToTimeline(listener);
        }
    };
    
    /**
     * Removes all event data from map and timeline
     *
     */
    this.clear = function(){
        // clear map
        this.removeMarkers(_timelineMarkers);
        this.removeMarkers(_nonTimelineMarkers);
        
        // clear timeline
        _eventSource.clear();    
    }
        
    /**
     * Searches an array of TimeMMarkers for a Timeline.DefaultEventSource.Event. 
     *
     * @param {Timeline.DefaultEventSource.Event} evt The event to be searched for
     * @param {TimeMMarker []} tmarr The array to be searched
     * @return The timeline marker that contains the event. If no timeline marker in the array has the event, return null
     */
    this.searchMarkersForEvent = function(evt, tmarr){
        //if the array is not an array of timeline markers, or the event is not a timeline event, return null
        if(tmarr.length < 0){
            throw "Expected array for second parameter";
        }
        
        if(!(tmarr[0] instanceof TimeMMarker) || !(evt instanceof Timeline.DefaultEventSource.Event)){
            throw "Expected Timeline.DefaultEventSource.Event for first parameter and TimeMMarker for second";
        }
        for(i = 0; i < tmarr.length; i++){
            if(tmarr[i].getEvent() == evt){
                return(tmarr[i]);
            }
        }
        return null;
    };
    
    /**
     * Returns the requested marker from the array of MMarkers
     *
     * @param id {string} Event ID to search for
     * @param {MMarker []} marr The array to be searched
     * @return The marker with the given id or null
     */
    this.getMarkerById = function(id, marr){
        if(marr.length < 0){
            DEBUG.error('MapTimeline:getMarkerById:  Expected array for second parameter');
            return null;
        }
        else if(marr.length == 0){
            DEBUG.warn('MapTimeline:getMarkerById:  MMarker[] doesn\'t contain any markers');
            return null;
        }
        else if(!(marr[0] instanceof MMarker)){
            DEBUG.error('MapTimeline:getMarkerById:  Expected MMarker for second parameter');
            return null;
        }
        
        for(i = 0; i < marr.length; i++){
            if(marr[i].getId() == id){
                return(marr[i]);
            }
        }
        DEBUG.debug('MapTimeline:getMarkerById:  Could not find marker #' + id);
        return null;
    };
    
    /**
     * Adds a data point to map and timeline
     *
     * @param {String} guid Unique global identifier
     * @param {String} start (optional) date in the format '2008-04-13 12:58Z' or null.  If no start then it will only be displayed on the map.
     * @param {String} end (optional) date in the format '2008-04-13 12:58Z' or null
     * @param {String} title Text to display on timeline
     * @param {String} description Text displayed in popup bubble
     * @param {Decimal} lat (optional) Latitude
     * @param {Decimal} lon (optional) Longitude
     * @param {String} image (optional) URL of image to display in popup bubble
     * @param {String} link (optional) URL of link to display in popup bubble
     */
    this.addEvent = function(guid, start, end, title, description, lat, lon, image, link){
        this.addEvents([{
            'id': guid,
            'start': start,
            'end': end,
            'title': title || "",
            'description': description || "",
            'lat': lat,
            'lon': lon,
            'image': image,
            'link': link
        }]);
    }
        
    /**
     * Adds all data points to map and timeline
     *
     * @param data a JSON object (e.g. [{'id': 23, 'start': '2008-04-13 12:58Z','end': '2008-04-13 12:58Z', 'title': 'Example', 'lat': 10, 'lon': 20, 'description': 'text', 'image': 'url', 'link': 'url' }, ...]
     * @param format a string defining the event state/end format to be expected (e.g. iso8601) (optional)
     */
    this.addEvents = function(data, dateFormat){
        dateFormat = dateFormat || 'iso8601';
        data = data || [];
        
        // exit if no events
        if (data.length <= 0){
            return;
        }
        
        //
        // add to timeline
        //
        DEBUG.debug('MapTimeline:addEvents:  adding events to timeline');
        var baseUrl = "/";
        try{
            _eventSource.loadJSON({
                    'dateTimeFormat': dateFormat,
                    'events' : data}, baseUrl);
        }catch(e){
            if (e == "TypeError: D is null"){
                DEBUG.error('MapTimeline:addEvents: Dateformat of event isn\'t recognized');
            }
            else{
                DEBUG.error('MapTimeline:addEvents: '+e);
            }
        }
        DEBUG.debug('MapTimeline:addEvents:  timeline-done.');
        
        //
        // add to map
        //
        DEBUG.debug('MapTimeline:addEvents:  adding events to map');
        
        // define onclick handler for map markers
        var timeMarkerOnClick = function(evt, self, mmarker){
            DEBUG.debug('MapTimeline:addEvents:  timeMarkerOnClick event fired');
            var markerEvent = mmarker.getEvent();
            
            // define code to execute after we are finished scrolling to focus on event (see 'BUG FIX' reason below)
            var execAfterScroll = function() {
                // display timeline popup
                _tl.getBand(_mainBandIdx).getEventPainter().showBubble(markerEvent);
            };
            
            // is event in current view
            var minDate = _tl.getBand(_mainBandIdx).getMinVisibleDate();
            var maxDate = _tl.getBand(_mainBandIdx).getMaxVisibleDate();
            var eventInView = ((markerEvent.getStart() < minDate) || (markerEvent.getStart() > maxDate)) ? false : true;
    
            // get associated map marker to highlight
            var timeMarker = self.searchMarkersForEvent(markerEvent, _timelineMarkers);
            self.highlightMarker(timeMarker);
    
            // Shift timeline so the corresponding event to the marker is centered on the band
            if ( (eventInView == false) && (markerEvent.getStart() instanceof Date) ) {
                _tl.getBand(_mainBandIdx).scrollToCenter(markerEvent.getStart());
                
                // BUG FIX: scrollToCenter() uses a setTimeout in it's animation.run() so it gets fired and execution continues
                // therefore we hop into the code below before we are finished scrolling
                // it will finish execution after a max of 1 sec, so we pause for 1.5 seconds before continuing (displaying popups)
                window.setTimeout(execAfterScroll, 1500);
            }
            else{
                execAfterScroll();
            }
            
            Event.stop(evt);
        };
        var nonTimeMarkerOnClick = function(evt, self, mmarker){
            DEBUG.debug('MapTimeline:addEvents:  nonTimeMarkerOnClick event fired');
            var markerEvent = mmarker.getEvent();
            
            DEBUG.warn('MapTimeline:addEvents nonTimeMarkerOnClick not defined because we don\'t have popups on map yet');
            
            Event.stop(evt);
        };
        
        for (var index = 0, len = data.length; index < len; ++index) {
            var item = data[index];
            if (item.id == null){
                DEBUG.warn('MapTimeline:addEvents no id for event');
            }
            
            if(item.lat != null && item.lon != null){
                if(item.start != null){
                    // there is a time associated with event
                    var lonlat = new OpenLayers.LonLat(item.lon, item.lat);
                    var size = new OpenLayers.Size(this.options.markerOff.width, this.options.markerOff.height);
                    var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
                    var url = this.options.markerOff.url;
                    var icon = new OpenLayers.Icon(url, size, offset);
                    
                    var evt = _eventSource.getEvent(item.id);
                    
                    var marker = new TimeMMarker(item.id, lonlat, item.description, icon, evt, _tl.getBand(_mainBandIdx), _mapLayers.main, null, timeMarkerOnClick);
                    
                    DEBUG.debug('MapTimeline:addEvents:  added new TimeMMarker.  Event id #' + item.id);
                    _timelineMarkers.push(marker);
                }
                else{
                    // no time associated with event, so use the MMarker
                    var lonlat = new OpenLayers.LonLat(item.lon, item.lat);
                    var size = new OpenLayers.Size(this.options.markerOff.width, this.options.markerOff.height);
                    var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
                    var url = this.options.markerOff.url;
                    var icon = new OpenLayers.Icon(url, size, offset);
                    
                    var marker = new MMarker(item.id, lonlat, item.description, icon, _mapLayers.main, null, nonTimeMarkerOnClick);
                    
                    DEBUG.debug('MapTimeline:addEvents:  added new MMarker.  Event id #' + item.id);
                    _nonTimelineMarkers.push(marker);
                }
            }
            else{
                DEBUG.debug('MapTimeline:addEvents:  added event to timeline, but missing lat/lon for map.  Event id #' + item.id);
            }
        }
        DEBUG.debug('MapTimeline:addEvents:  timelineMarkers count='+_timelineMarkers.length+', nonTimelineMarkers count='+_nonTimelineMarkers.length);
        
        // show all markers on layer
        this.showMarkers(_timelineMarkers);
        
        DEBUG.debug('MapTimeline:addEvents:  map-done.');
    };
    
    /*
     * Remove events given by array
     *
     * @param events {array} An array of event objects
     */
    this.removeEvents = function(events){
        DEBUG.debug('MapTimeline:removeEvents:  removing events from map and timeline');
        
        // go through the events to query on its id
        for (var index = 0, len = events.length; index < len; ++index) {
            var id = events[index].id;
            
            // remove from map
            var marker = null;
            marker = this.getMarkerById( id, _timelineMarkers);
            if (marker != null){
                DEBUG.debug('MapTimeline:removeEvents:  removing event id #' + id + ' from map (_timelineMarkers)');
                this.removeMarker(_timelineMarkers, marker);
            }
            else{
                // not found in timeline markers, so its gotta be in the non TL then
                marker = this.getMarkerById( id, _nonTimelineMarkers);
                if (marker != null){
                    DEBUG.debug('MapTimeline:removeEvents:  removing event id #' + id + ' from map (_nonTimelineMarkers)');
                    this.removeMarker(_nonTimelineMarkers, marker);
                }
                else{
                    DEBUG.error('MapTimeline:removeEvents:  event id #' + id + ' was not found in marker arrays. Not removed from map');
                }
            }
            
            // remove from timeline
            DEBUG.debug('MapTimeline:removeEvents:  removing event id #' + id + ' from timeline');
            _eventSource.remove( id );
        }
        DEBUG.debug('MapTimeline:removeEvents:  done.');
    };
        
    /*
     * Filters events to only display those matches
     *
     * @param text {string} The text to search for and filter on.  May be a regex like "John|Syp".
     * @param attribute_list {array} A list of attributes to filter against
     * @param enable_regex {bool} Whether text should be considered plain text or a regex (default: false)
     * @see http://developer.mozilla.org/en/Core_JavaScript_1.5_Guide/Regular_Expressions
     */
    this.filterEvents = function(text, attribute_list, enable_regex){
        enable_regex = enable_regex || false;
        
        if (enable_regex == false){
            // since we aren't enabling regex then we need to escape any chars that could be mistaken for regex
            var specials = [
                '/', '.', '*', '+', '?', '|',
                '(', ')', '[', ']', '{', '}', '\\'
            ];
            var specials_re = new RegExp(
                '(\\' + specials.join('|\\') + ')', 'g'
            );
            text = text.replace(specials_re, '\\$1');
        }
        
        //
        // filter timeline
        //
        var filterMatcher = null;
        if (text.length > 0) {
            try{
                var regex = new RegExp(text, "i");
                filterMatcher = function(evt) {
                    var exp = false;
                    var val = '';
                    for (var i=0, len=attribute_list.length; i < len; i++){
                        if (attribute_list[i] == 'description'){
                            val = evt.getDescription();
                        }
                        else if (attribute_list[i] == 'title'){
                            val = evt.getText();
                        }
                        exp = exp || regex.test(val);
                    }
                    return exp;
                };
            }catch(e){
                // bad reg ex... so filterMatcher stays null
            }
        }
        
        var bandIndices = _tl.getBandCount();
        for (var bandIdx = 0; bandIdx < bandIndices; bandIdx++) {
            _tl.getBand(bandIdx).getEventPainter().setFilterMatcher(filterMatcher);
            //_tl.getBand(bandIdx).getEventPainter().setHighlightMatcher(highlightMatcher);
        }
        _tl.paint();
        
        //
        // filter map
        //
        this.filterMarkers(filterMatcher);
    };
    
    
    
    // -----------------------------------------------------------------
    // start 'er up
    // -----------------------------------------------------------------
    _init(my_options);
}    



/***************************************
 * Timeline Extensions
 * this section allows us to add functionality to the Simile Timeline
 * that it doesn't already have so we can do our job of syncing them.
 * We don't want to edit the file itself so that we can upgrade with ease,
 * but some caution may be taken because we are modified the object.
 */

/**
 * Enable ability to remove events from timeline
 *
 * @ignore
 */
Timeline.DefaultEventSource.prototype.remove = function(id) {
    this._events.remove(id);
    this._fire("onClear", []);
};
/**
 * @ignore
 */
SimileAjax.EventIndex.prototype.remove = function(id) {
    var evt = this._idToEvent[id];
    this._events.remove(evt);
    delete this._idToEvent[id];
};
