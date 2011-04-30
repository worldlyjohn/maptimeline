/**
 * @fileoverview
 * This file contains the declaration for the MMarker and TimeMMarker classes. In the TimeMMarker class, 
 * it also specifies what interaction should happen when a map marker with additional Timeline data (i.e. 
 * a TimeMMarker) is clicked
 *
 * @author John Brennan <john@janisb.com>
 * @version 0.8 (2008/01/01)
 */

/**
 * @class
 * Represents a marker to be displayed on an OpenLayers map. Also has an associated popup
 * This class references the OpenLayers Map API and Simile Timeline API. For more information see
 * {@link http://openlayers.org/ OpenLayers} and {@link http://simile.mit.edu/timeline/ Simile Timeline}
 *
 * @constructor
 * @param {String} id A unique string to identify this marker
 * @param {OpenLayers.LonLat} point_in longitude/latitude location of the marker
 * @param {String} html_in HTML text to be displayed in the associated popup
 * @param {OpenLayers.Icon} icon_in Icon for marker
 * @param {OpenLayers.Layer} layer_in Layer for the popup feature to be displayed on (typically a WMS layer)
 * @param {OpenLayers.Feature.Vector} featureVectors_in Array of feature vectors associated with the marker 
 *        (typically geoRSS). May be null
 * @param {Function} callBack function to call when map marker is clicked
 */
function MMarker(id, point_in, html_in, icon_in, layer_in, featureVectors_in, callBack){
	/**
	 * @type String
	 */
    this.id = id;
	/**
	 * @type Boolean
	 */
    this.displayed = false;
	/**
	 * @type {OpenLayers.Popup}
	 */
    this.popup = null;
	/**
	 * @type {OpenLayers.Feature}
	 */
    this.feature = null;
	/**
	 * @type {OpenLayers.Marker}
	 */
    this.marker = null;
	/**
	 * @type {OpenLayers.Feature.Vector}
	 */
    this.featureVectors = null;
    
	/**
	 * @type {OpenLayers.Feature Data}
	 */
    this.featureData = {'icon': icon_in} || null;
	/**
	 * @type String
	 */
    this.html = html_in || "";
	/**
	 * @type {OpenLayers.LonLat}
	 */
    this.point = point_in || null;
	/**
	 * @type {OpenLayers.Layer}
	 */
    this.layer = layer_in || null;
	/**
	 * @type {OpenLayers.Feature.Vector}
	 */
    this.featureVectors = featureVectors_in || null;
	/**
	 * This function is called whenever the marker is clicked
	 * @type Function
	 */
    this.eventFunction = callBack || function(){};
    
    if (this.layer != null && this.point != null){
        this.feature = new OpenLayers.Feature(this.layer, this.point, this.featureData);
        
        // create marker
        this.marker = this.feature.createMarker();
        
        // Initially, displayed is false; the marker is turned off
        this.marker.display(this.displayed);
    }

    
    /**
     * @return {String} The unique id for this marker 
     */
    this.getId = function(){
        return this.id;
    }
    /**
     * @return {OpenLayers.Feature} The feature used to create this MMarker's OpenLayers.Marker. Note: This is NOT NECESSARILY a 
     *         feature vector. 
     */
    this.getFeature = function(){
        return this.feature;
    }
    /**
     * @return {Function} The event function for this marker. Use for events like mousedown, etc. 
     * See OpenLayers.showMarker() for example usage
     */
    this.getEventFunction = function(){
        return this.eventFunction;
    }
    /**
     * @return {String} The HTML to be placed in this marker's popup and displayed upon click
     */
    this.getHtml = function(){
        return this.html;
    }
    /**
     * @return {OpenLayers.LonLat} The latitude and longitude of this marker's popup
     */
    this.getPoint = function(){
        return this.point;
    }
    /**
     * @param {OpenLayers.LonLat} The latitude and longitude of this marker's popup
     */
    this.setPoint = function(pt){
        this.point=pt;
    }
    /**
     * @return {OpenLayers.Marker} This MMarker's actual OpenLayers.Marker
     */
    this.getMarker = function(){
        return this.marker;
    }
    /**
     * @return {OpenLayers.Icon} for marker
     */
    this.getMarkerIcon = function(){
        return this.featureData.icon;
    }
    /**
     * Sets the marker icon
     * @param {String} url
     * @param {Integer} width
     * @param {Integer} height
     */
    this.setMarkerIcon = function(url, width, height){
        var icon = this.featureData.icon;
        if (width != null && height != null && (width != icon.width && height != icon.height)){
            var size = new OpenLayers.Size(width, height);
            icon.setSize(size);
        }
        icon.url = url;
        icon.draw();
    }
    /**
     * Displays this marker
     */
    this.show = function(){
        this.displayed = true;
    
        this.marker.display(this.displayed);
    }
    /**
     * Hides this marker
     */
    this.hide = function(){
        this.displayed = false;
        this.marker.display(this.displayed);
    }
    /**
     * Sets this marker's current marker to p
     *
     * @param {OpenLayers.Popup} The new popup to be used
     */
    this.setPopup = function(p){
        this.popup = p;
    }
    /**
     * @return {OpenLayers.Popup} This marker's popup
     */
    this.getPopup = function(){
        return this.popup;
    }
    /**
     * Destroys this marker's popup
     */
    this.destroyPopup = function(){
        this.popup.destroy();
        this.popup = null;
    }
    /**
     * @return {Boolean} True if this marker is hidden. False otherwise
     */
    this.isHidden = function(){
        return(!this.displayed);
    }
    /**
     * @return {OpenLayers.Feature.Vector[]} The array of OpenLayers.Feature.Vector associated with this marker. Typically used when GeoRSS 
     *        is connected to the marker
     */
    this.getFeatureVectors = function(){
        return this.featureVectors;
    }

}


/**
 * @class TimeMMarker is an MMarker with an additional associated Simile Timeline.DefaultEventSource.Event. This event 
 *        can be used to trigger a Simile timeline to display the event. 
 * @constructor
 * @constructor
 * @param {OpenLayers.LonLat} point_in longitude/latitude location of the marker
 * @param {String} html_in HTML text to be displayed in the associated popup
 * @param {OpenLayers.Icon} icon_in Icon for marker
 * @param {Timeline.DefaultEventSource.Event} Timeline event this marker is associated with
 * @param {Timeline._Band} Timeline band this marker's event is located in
 * @param {OpenLayers.Layer} layer_in Layer for the popup feature to be displayed on (typically a WMS layer)
 * @param {OpenLayers.Feature.Vector} featureVectors_in Array of feature vectors associated with the marker 
 *        (typically geoRSS). May be null
 * @param {Function} callBack function to call when map marker is clicked
 */
TimeMMarker = function(id, point_in, html_in, icon_in, evt_in, evtBand_in, layer_in, featureVectors_in, callBack){
    this.base = MMarker;
    this.base(id, point_in, html_in, icon_in, layer_in, featureVectors_in, callBack);
    
	/**
	 * @type {Timeline.DefaultEventSource.Event}
	 */
    this.tevt = evt_in;
	/**
	 * @type {Timeline._Band}
	 */
    this.evtBand = evtBand_in;

    /**
     * @return {Timeline.DefaultEventSource.Event} The Simile Timeline.DefaultEventSource.Event associated with this marker
     */
    this.getEvent = function(){
        return this.tevt;
    }
    /**
     * @return {Timeline._Band} The Simile Timeline._Band associated with this marker
     */
    this.getEventBand = function(){
        return this.evtBand;
    }
}
TimeMMarker.prototype = new MMarker;
