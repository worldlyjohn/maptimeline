/** 
 * @fileoverview This file is to be used to demonstrate the capabilities
 * of the {@link http://code.google.com/p/maptimeline/ MapTimeline module}.
 *
 * This demo shows how to add additional WMS layers
 *
 * @author John Brennan <john@janisb.com>
 * @version 0.8
 */

(function() {
	var mt = null;

 	function loadMTL(){
        // create options for MapTimeline
        var mtlOptions = {
            'zoom': 2,
            'mapcenter': {'lat':27, 'lon':67},
            'timecenter': new Date("February 13, 2007 13:14:00"),
            'markerOff': {'url': OpenLayers.Util.getImagesLocation()+"marker-green.png", 'width': 21, 'height': 25},
            'markerOn': {'url': OpenLayers.Util.getImagesLocation()+"marker-gold.png", 'width': 21, 'height': 25}
        };
        
	 	//
	 	// initialize the MapTimeline component
        //
        mt = new MapTimeline(mtlOptions);
        
        
        //
        // customize the map controls
        //
        mt.initMap('map', {'maxResolution': 360/512, 'controls':[]});
        
        // Add controls
        var control_overview = new OpenLayers.Control.OverviewMap();
        mt.addControl(control_overview);
        control_overview.maximizeControl();
        mt.addControl(new OpenLayers.Control.PanZoomBar());
        mt.addControl(new OpenLayers.Control.MousePosition());
        mt.addControl(new OpenLayers.Control.LayerSwitcher());
        
        var layer1 = new OpenLayers.Layer.WMS.Untiled("NASA Global Mosaic", "http://wms.jpl.nasa.gov/wms.cgi", {layers: "modis,global_mosaic"});
        layer1.setVisibility(false);
        mt.addLayer(layer1);
        
        
        //
        // customize the timeline controls
        //
        var eventSource = new Timeline.DefaultEventSource(0);
        var bandInfos = [
            Timeline.createBandInfo({
                eventSource:    eventSource,
                width:          "65%", 
                intervalUnit:   Timeline.DateTime.DAY, 
                intervalPixels: 100
                //, theme:          theme
            }),
            Timeline.createBandInfo({
                overview: 	    true,
                eventSource:    eventSource,
                width:          "20%", 
                intervalUnit:   Timeline.DateTime.WEEK, 
                intervalPixels: 200
            }),
            Timeline.createBandInfo({
                overview: 	    true,
                eventSource:    eventSource,
                width:          "15%", 
                intervalUnit:   Timeline.DateTime.YEAR, 
                intervalPixels: 400
            })
        ];
        bandInfos[1].syncWith = 0;
        bandInfos[1].highlight = true;
        bandInfos[2].syncWith = 0;
        bandInfos[2].highlight = true;
        
        mt.initTimeline('timeline', bandInfos, Timeline.HORIZONTAL, eventSource);
        
	}
 	function addEvents(){
    	mt.addEvent('1', '2008-11-13 12:58Z', null, 'San Diego', 'Location where this code was developed', 32.65714, -117.241);
    	mt.addEvent('2', '2008-11-15 12:58Z', null, 'Sudan', 'Don\'t forgot the conflicts in Darfur', 15, 30);
    	mt.addEvent('3', '2007-02-13 12:58Z', null, 'Tibet', 'The Tibetan people are denied most rights guaranteed in the Universal Declaration of Human Rights, including the rights to self-determination, freedom of speech, assembly, movement, expression, and travel', 29.8, 83.6);
 	}
	
	loadMTL();
	addEvents();
})();
 